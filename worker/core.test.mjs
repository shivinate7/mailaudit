/* Contract tests for the sync server's core, worker/core.mjs. Run with
   `npm run test:worker`. Plain node, no framework, the same ok/eq style as
   test/app.test.mjs. The core is the pure half of the Cloudflare Worker, so
   every rule here runs with no Worker, no Durable Object and no network.

   The store is a fake that records what it was asked to do, in order, and
   clones every value it gets or returns. So a core that mutates its input
   cannot pass by accident, and a test can see that write comes before
   broadcast.

   Keys are hashed here with node:crypto, not the core's Web Crypto, so a bug
   in the core's hashing fails a test instead of matching itself. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mergeLedger } from "../src/merge-rules.mjs";

/* A missing or broken core fails in one clear line, not a raw stack trace. */
let route, keyAllowed, wsAuthorized, MAX_LEDGER_BYTES, MAX_PHOTO_BYTES;
try {
  ({ route, keyAllowed, wsAuthorized, MAX_LEDGER_BYTES, MAX_PHOTO_BYTES } = await import("./core.mjs"));
} catch (e) {
  console.log(
    `FAIL worker/core.mjs does not load (expected until the core is built): ${e.message.split("\n")[0]}`
  );
  process.exit(1);
}
if (typeof route !== "function") {
  console.log("FAIL worker/core.mjs does not export route(request, env, store)");
  process.exit(1);
}
if (typeof MAX_LEDGER_BYTES !== "number") {
  console.log("FAIL worker/core.mjs does not export MAX_LEDGER_BYTES");
  process.exit(1);
}
if (typeof keyAllowed !== "function" || typeof wsAuthorized !== "function") {
  console.log("FAIL worker/core.mjs does not export keyAllowed(key, env) and wsAuthorized(request, env)");
  process.exit(1);
}

/* ---------- harness: the ok/eq/report shape of test/app.test.mjs ---------- */
let pass = 0;
const fails = [];
let current = "";

function ok(cond, label) {
  if (cond) pass++;
  else fails.push(`${current}: ${label}`);
}

/* Key order is not part of the contract, so both sides are canonicalised. */
const canon = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))
      : x
  );

function eq(actual, expected, label) {
  const a = canon(actual);
  const e = canon(expected);
  if (a === e) pass++;
  else fails.push(`${current}: ${label}\n     expected ${e}\n     actual   ${a}`);
}

/* A throw inside one test fails that test, and the run goes on. */
async function test(id, fn) {
  current = id;
  try {
    await fn();
  } catch (e) {
    fails.push(`${id}: threw ${e.message}`);
  }
}

function report() {
  console.log(`\n${pass} passed, ${fails.length} failed`);
  for (const f of fails) console.log(`  ✗ ${f}`);
  if (fails.length) process.exit(1);
  console.log("all green");
}

/* ---------- fixtures ---------- */
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const KEY_PHONE = "k-test-phone-7f3a9c";
const KEY_LAPTOP = "k-test-laptop-b21e04";
const KEY_STRANGER = "k-test-stranger-00000";
const ENV = {
  DEVICE_KEY_HASHES: `${sha256(KEY_PHONE)},${sha256(KEY_LAPTOP)}`,
  ALLOWED_ORIGINS: "https://shivinate7.github.io,http://localhost:4173",
};
const BASE = "https://manifestnumberone.shivamsemwal01.workers.dev";
const PAGES = "https://shivinate7.github.io";
const LOCAL = "http://localhost:4173";
const STRANGER = "https://evil.example";

const item = (key, name, qty = 1) => ({ key, name, qty });
const ledger = (over = {}) => ({
  mailday: 1,
  items: [item("100|1|555", "Alpha Card", 2)],
  received: {},
  envelopes: [],
  stamps: {},
  dateFilter: "30d",
  sortBy: "date",
  itemSort: "name",
  ...over,
});
const clone = (v) => structuredClone(v);

/* initial is {ledger, rev} or null for an empty store. The photo half of the
   store is three methods, named here as the contract the Durable Object
   adapter (worker/index.mjs) must provide:
     photoList()            -> [id, ...]
     photoGet(id)           -> {mime, bytes} | null
     photoPut(id, mime, bytes) -> void   (the route, not the store, enforces write-once)
   photoWrites counts every photoPut call, so a route that writes twice shows. */
function fakeStore(initial = null) {
  const s = {
    state: initial ? clone(initial) : null,
    writes: [],
    broadcasts: [],
    order: [],
    photos: new Map(),
    photoWrites: [],
  };
  s.photoList = async () => [...s.photos.keys()];
  s.photoGet = async (id) => {
    const p = s.photos.get(id);
    return p ? { mime: p.mime, bytes: p.bytes.slice() } : null;
  };
  s.photoPut = async (id, mime, bytes) => {
    s.photoWrites.push(id);
    s.photos.set(id, { mime, bytes: new Uint8Array(bytes) });
  };
  s.read = async () => (s.state ? clone(s.state) : null);
  s.write = async (l, rev) => {
    s.order.push("write");
    s.writes.push({ ledger: clone(l), rev });
    s.state = { ledger: clone(l), rev };
  };
  s.broadcast = async (obj) => {
    s.order.push("broadcast");
    s.broadcasts.push(clone(obj));
  };
  return s;
}

/* o: key (sent as Bearer), auth (raw Authorization), origin, headers, and
   json or raw as the body. */
function req(method, path, o = {}) {
  const headers = { ...(o.headers || {}) };
  if (o.key !== undefined) headers.Authorization = `Bearer ${o.key}`;
  if (o.auth !== undefined) headers.Authorization = o.auth;
  if (o.origin !== undefined) headers.Origin = o.origin;
  let body;
  if (o.json !== undefined) body = JSON.stringify(o.json);
  if (o.raw !== undefined) body = o.raw;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return new Request(BASE + path, { method, headers, body });
}

const send = (store, method, path, o) =>
  route(req(method, path, o), ENV, store);

/* A photo request: raw bytes, no JSON content type, so the route must take the
   media type from the file name, not from the request. */
const photoReq = (method, path, { key, bytes, type = "application/octet-stream" } = {}) => {
  const headers = { "Content-Type": type };
  if (key !== undefined) headers.Authorization = `Bearer ${key}`;
  return new Request(BASE + path, { method, headers, body: bytes });
};
const sendPhoto = (store, method, path, o) => route(photoReq(method, path, o), ENV, store);
const PHO_JPG = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]);
const PHO_OTHER = new Uint8Array([9, 8, 7, 6]);

const list = (v) =>
  (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const seeded = () => fakeStore({ ledger: ledger(), rev: 3 });
const empty = () => fakeStore(null);

/* Bodies the route must refuse with 400, and write nothing for. */
const BAD_BODIES = [
  { json: { ledger: { mailday: 2, items: [] } } },
  { json: { ledger: { mailday: "1", items: [] } } },
  { json: { ledger: { items: [] } } },
  { json: { ledger: { mailday: 1, items: {} } } },
  { json: { ledger: { mailday: 1, items: "x" } } },
  { json: { ledger: { mailday: 1 } } },
  { json: {} },
  { raw: "{not json" },
];

/* ---------- 1. auth: Bearer key, hashed against DEVICE_KEY_HASHES ---------- */
await test("1.1 the first listed device key reads the ledger", async () => {
  const res = await send(seeded(), "GET", "/ledger", { key: KEY_PHONE });
  eq(res.status, 200, "status");
});

await test("1.2 the second listed device key reads the ledger", async () => {
  const res = await send(seeded(), "GET", "/ledger", { key: KEY_LAPTOP });
  eq(res.status, 200, "status");
});

await test("1.3 a key not in the list gets 401 on read", async () => {
  const res = await send(seeded(), "GET", "/ledger", { key: KEY_STRANGER });
  eq(res.status, 401, "status");
});

await test("1.4 a key not in the list cannot write", async () => {
  const s = seeded();
  const before = clone(s.state);
  const res = await send(s, "POST", "/ledger", {
    key: KEY_STRANGER,
    json: { ledger: ledger() },
  });
  eq(res.status, 401, "status");
  eq(s.writes.length, 0, "writes");
  eq(s.broadcasts.length, 0, "broadcasts");
  eq(s.state, before, "store unchanged");
});

await test("1.5 no Authorization header gets 401, on read and on write", async () => {
  const s = seeded();
  eq((await send(s, "GET", "/ledger", {})).status, 401, "GET status");
  eq(
    (await send(s, "POST", "/ledger", { json: { ledger: ledger() } })).status,
    401,
    "POST status"
  );
  eq(s.writes.length, 0, "POST wrote nothing");
});

await test("1.6 a scheme other than Bearer gets 401", async () => {
  const s = seeded();
  eq(
    (await send(s, "GET", "/ledger", { auth: `Basic ${KEY_PHONE}` })).status,
    401,
    "Basic scheme"
  );
  eq(
    (await send(s, "GET", "/ledger", { auth: KEY_PHONE })).status,
    401,
    "bare key with no scheme"
  );
});

await test("1.7 the stored hash is not itself a key", async () => {
  const res = await send(seeded(), "GET", "/ledger", {
    key: sha256(KEY_PHONE),
  });
  eq(res.status, 401, "status");
});

await test("1.8 a 401 never echoes the presented key", async () => {
  const res = await send(seeded(), "GET", "/ledger", { key: KEY_STRANGER });
  const text = await res.text();
  ok(!text.includes(KEY_STRANGER), "body contains the presented key");
  ok(
    ![...res.headers.values()].some((v) => v.includes(KEY_STRANGER)),
    "a header contains the presented key"
  );
});

await test("1.9 auth is checked before the empty-store answer", async () => {
  const res = await send(empty(), "GET", "/ledger", {});
  eq(res.status, 401, "no header on an empty store is 401, not 404");
});

/* keyAllowed is reached only through route() and wsAuthorized() above, so
   these pin it directly. */
await test("1.10 keyAllowed is true for each listed device key", async () => {
  eq(await keyAllowed(KEY_PHONE, ENV), true, "first listed key");
  eq(await keyAllowed(KEY_LAPTOP, ENV), true, "second listed key");
});

await test("1.11 keyAllowed is false for a stranger, an empty or a missing key", async () => {
  eq(await keyAllowed(KEY_STRANGER, ENV), false, "stranger key");
  eq(await keyAllowed("", ENV), false, "empty string");
  eq(await keyAllowed(undefined, ENV), false, "undefined");
});

await test("1.12 keyAllowed is false for the stored hash used as the key", async () => {
  eq(await keyAllowed(sha256(KEY_PHONE), ENV), false, "hash as key");
});

/* ---------- 2. GET /ledger ---------- */
await test("2.1 GET on an empty store is 404 {error: empty}", async () => {
  const res = await send(empty(), "GET", "/ledger", { key: KEY_PHONE });
  eq(res.status, 404, "status");
  eq(await res.json(), { error: "empty" }, "body");
});

await test("2.2 GET returns the stored ledger and its rev", async () => {
  const stored = ledger({ received: { "100|1|555": 1 } });
  const s = fakeStore({ ledger: stored, rev: 4 });
  const res = await send(s, "GET", "/ledger", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  eq(await res.json(), { ledger: stored, rev: 4 }, "body");
});

await test("2.3 GET writes and broadcasts nothing", async () => {
  const s = seeded();
  await send(s, "GET", "/ledger", { key: KEY_PHONE });
  eq(s.writes.length, 0, "writes");
  eq(s.broadcasts.length, 0, "broadcasts");
});

/* ---------- 3. POST /ledger refuses bad bodies ---------- */
await test("3.1 a bad body on a stored ledger gets 400 and changes nothing", async () => {
  for (const [i, b] of BAD_BODIES.entries()) {
    const s = seeded();
    const before = clone(s.state);
    const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, ...b });
    eq(res.status, 400, `bad body ${i}: status`);
    eq(s.writes.length, 0, `bad body ${i}: writes`);
    eq(s.broadcasts.length, 0, `bad body ${i}: broadcasts`);
    eq(s.state, before, `bad body ${i}: store unchanged`);
  }
});

await test("3.2 the same bad bodies on an empty store write nothing", async () => {
  for (const [i, b] of BAD_BODIES.entries()) {
    const s = empty();
    const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, ...b });
    eq(res.status, 400, `bad body ${i}: status`);
    eq(s.writes.length, 0, `bad body ${i}: writes`);
    eq(s.state, null, `bad body ${i}: store still empty`);
  }
});

/* ---------- 4. POST /ledger writes and merges ---------- */
await test("4.1 the first ledger on an empty store is written verbatim at rev 1", async () => {
  const incoming = ledger({ received: { "100|1|555": 1 } });
  const s = empty();
  const res = await send(s, "POST", "/ledger", {
    key: KEY_PHONE,
    json: { ledger: incoming },
  });
  eq(res.status, 200, "status");
  eq(s.writes.length, 1, "writes");
  eq(s.writes[0]?.rev, 1, "write rev");
  eq(s.writes[0]?.ledger, incoming, "written ledger");
  eq((await res.json()).rev, 1, "response rev");
});

await test("4.2 a merge is written at the stored rev plus one", async () => {
  const s = fakeStore({ ledger: ledger(), rev: 4 });
  const res = await send(s, "POST", "/ledger", {
    key: KEY_PHONE,
    json: { ledger: ledger() },
  });
  eq(res.status, 200, "status");
  eq(s.writes.length, 1, "writes");
  eq(s.writes[0]?.rev, 5, "write rev");
  eq(s.state?.rev, 5, "stored rev");
  eq((await res.json()).rev, 5, "response rev");
});

/* Each side holds something the other lacks: an item, a check-in and an
   envelope on both. The server copy stands for the phone, the posted copy for
   the laptop. */
const PHONE_SIDE = ledger({
  items: [item("100|1|555", "Alpha Card", 2), item("100|2|556", "Beta Card", 1)],
  received: { "100|1|555": 1 },
  envelopes: [{ id: "env-phone", createdAt: 1, updatedAt: 1, label: "phone" }],
});
const LAPTOP_SIDE = ledger({
  items: [item("100|1|555", "Alpha Card", 2), item("200|1|777", "Gamma Card", 1)],
  received: { "200|1|777": 2 },
  envelopes: [{ id: "env-laptop", createdAt: 2, updatedAt: 2, label: "laptop" }],
});

await test("4.3 a merge keeps items, check-ins and envelopes from both sides", async () => {
  const s = fakeStore({ ledger: PHONE_SIDE, rev: 4 });
  const res = await send(s, "POST", "/ledger", {
    key: KEY_LAPTOP,
    json: { ledger: LAPTOP_SIDE },
  });
  eq(res.status, 200, "status");
  const written = s.writes[0]?.ledger ?? {};
  eq(
    written.items?.map((i) => i.key).sort(),
    ["100|1|555", "100|2|556", "200|1|777"],
    "item keys from both sides"
  );
  eq(
    written.received,
    { "100|1|555": 1, "200|1|777": 2 },
    "check-ins from both sides"
  );
  eq(
    written.envelopes?.map((e) => e.id).sort(),
    ["env-laptop", "env-phone"],
    "envelopes from both sides"
  );
  eq(
    written,
    JSON.parse(JSON.stringify(mergeLedger(PHONE_SIDE, LAPTOP_SIDE).merged)),
    "written ledger is mergeLedger(stored, incoming).merged"
  );
  eq((await res.json()).ledger, written, "response carries the written ledger");
});

await test("4.4 a stored check-in count is never lowered, and a higher one is taken", async () => {
  const s = fakeStore({
    ledger: ledger({ received: { "100|1|555": 5 } }),
    rev: 4,
  });
  await send(s, "POST", "/ledger", {
    key: KEY_LAPTOP,
    json: {
      ledger: ledger({ received: { "100|1|555": 2, "300|1|1": 3 } }),
    },
  });
  eq(
    s.writes[0]?.ledger.received,
    { "100|1|555": 5, "300|1|1": 3 },
    "per-key max"
  );
});

await test("4.5 the stored view preferences win over the incoming ones", async () => {
  const s = fakeStore({
    ledger: ledger({ dateFilter: "30d", sortBy: "date", itemSort: "name" }),
    rev: 4,
  });
  await send(s, "POST", "/ledger", {
    key: KEY_LAPTOP,
    json: {
      ledger: ledger({ dateFilter: "all", sortBy: "name", itemSort: "qty" }),
    },
  });
  const w = s.writes[0]?.ledger ?? {};
  eq(
    [w.dateFilter, w.sortBy, w.itemSort],
    ["30d", "date", "name"],
    "stored dateFilter, sortBy, itemSort kept"
  );
});

await test("4.6 a newer tombstone clears an older stamp, and an older one does not", async () => {
  const s = fakeStore({
    ledger: ledger({
      stamps: {
        "111::Seller A": { kind: "refunded", updatedAt: 5 },
        "222::Seller B": { kind: "refunded", updatedAt: 9 },
      },
    }),
    rev: 4,
  });
  await send(s, "POST", "/ledger", {
    key: KEY_LAPTOP,
    json: {
      ledger: ledger({
        stamps: {
          "111::Seller A": { kind: "", updatedAt: 9 },
          "222::Seller B": { kind: "", updatedAt: 5 },
        },
      }),
    },
  });
  eq(
    s.writes[0]?.ledger.stamps,
    {
      "111::Seller A": { kind: "", updatedAt: 9 },
      "222::Seller B": { kind: "refunded", updatedAt: 9 },
    },
    "stamps resolved by updatedAt, as mergeStamps does"
  );
});

await test("4.7 posting the same ledger twice bumps rev and changes no count", async () => {
  const L = ledger({
    items: [item("100|1|555", "Alpha Card", 2), item("100|2|556", "Beta Card", 1)],
    received: { "100|1|555": 1 },
    envelopes: [{ id: "env-x", createdAt: 1, updatedAt: 1 }],
    stamps: { "111::Seller A": { kind: "refunded", updatedAt: 3 } },
  });
  const s = empty();
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: L } });
  const res = await send(s, "POST", "/ledger", {
    key: KEY_PHONE,
    json: { ledger: L },
  });
  eq(res.status, 200, "second status");
  eq(
    s.writes.map((w) => w.rev),
    [1, 2],
    "revs"
  );
  const counts = (l) => ({
    items: l.items.length,
    checkIns: Object.values(l.received).reduce((a, b) => a + b, 0),
    envelopes: l.envelopes.length,
    stamps: Object.keys(l.stamps).length,
  });
  eq(counts(s.writes[1]?.ledger ?? {}), counts(s.writes[0]?.ledger ?? {}), "counts after the second post");
  eq((await res.json()).rev, 2, "response rev");
});

await test("4.8 every successful POST writes, then broadcasts {rev} once", async () => {
  const first = empty();
  await send(first, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: ledger() } });
  eq(first.broadcasts, [{ rev: 1 }], "first write broadcast");
  eq(first.order, ["write", "broadcast"], "first write order");

  const merge = fakeStore({ ledger: ledger(), rev: 4 });
  await send(merge, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: ledger() } });
  eq(merge.broadcasts, [{ rev: 5 }], "merge broadcast");
  eq(merge.order, ["write", "broadcast"], "merge order");
});

/* An un-check is a key that is absent from `received`, stamped with a later
   `receivedAt` than the stored check. The per-key max would keep the check. */
await test("4.9 a POST's un-check with a newer time beats the stored check", async () => {
  const K = "100|1|555";
  const s = fakeStore({
    ledger: ledger({ received: { [K]: 1 }, receivedAt: { [K]: 100 } }),
    rev: 4,
  });
  const res = await send(s, "POST", "/ledger", {
    key: KEY_LAPTOP,
    json: { ledger: ledger({ received: {}, receivedAt: { [K]: 200 } }) },
  });
  eq(res.status, 200, "status");
  eq(s.writes[0]?.ledger.received, {}, "the un-check wins, so the card is not checked");
  eq(s.writes[0]?.ledger.receivedAt, { [K]: 200 }, "and the winning time is stored");
});

/* ---------- 5. CORS ---------- */
/* [label, store, method, path, options, expected status] */
const CASES = [
  ["200 GET", seeded, "GET", "/ledger", { key: KEY_PHONE }, 200],
  ["200 POST", seeded, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: ledger() } }, 200],
  ["400 POST", seeded, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: { mailday: 2, items: [] } } }, 400],
  ["401 bad key", seeded, "GET", "/ledger", { key: KEY_STRANGER }, 401],
  ["404 empty", empty, "GET", "/ledger", { key: KEY_PHONE }, 404],
  ["404 unknown path", seeded, "GET", "/nope", { key: KEY_PHONE }, 404],
  ["405 wrong method", seeded, "PUT", "/ledger", { key: KEY_PHONE }, 405],
];

await test("5.1 an allowed origin is echoed on every response", async () => {
  for (const [name, mk, m, p, o, status] of CASES) {
    const res = await send(mk(), m, p, { ...o, origin: PAGES });
    eq(res.status, status, `${name}: status`);
    eq(res.headers.get("access-control-allow-origin"), PAGES, `${name}: ACAO`);
  }
});

await test("5.2 the second allowed origin is echoed too", async () => {
  const res = await send(seeded(), "GET", "/ledger", { key: KEY_PHONE, origin: LOCAL });
  eq(res.headers.get("access-control-allow-origin"), LOCAL, "ACAO");
});

await test("5.3 an unlisted origin gets no ACAO header on any response", async () => {
  for (const [name, mk, m, p, o] of CASES) {
    const res = await send(mk(), m, p, { ...o, origin: STRANGER });
    eq(res.headers.get("access-control-allow-origin"), null, `${name}: ACAO`);
  }
});

await test("5.4 an origin that only starts like an allowed one gets no ACAO", async () => {
  for (const near of [
    "https://shivinate7.github",
    "https://shivinate7.github.io.evil.example",
    "http://localhost:41730",
  ]) {
    const res = await send(seeded(), "GET", "/ledger", { key: KEY_PHONE, origin: near });
    eq(res.headers.get("access-control-allow-origin"), null, `${near}: ACAO`);
  }
});

await test("5.5 a request with no Origin is served, with no ACAO header", async () => {
  /* The nightly HA job posts with no Origin, so CORS must not be the gate. */
  const res = await send(seeded(), "GET", "/ledger", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  eq(res.headers.get("access-control-allow-origin"), null, "ACAO");
});

await test("5.6 a preflight from an allowed origin is 204 and carries no auth", async () => {
  const res = await send(seeded(), "OPTIONS", "/ledger", {
    origin: PAGES,
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization, content-type",
    },
  });
  /* A browser never sends Authorization on a preflight, so this must not be 401. */
  eq(res.status, 204, "status");
  eq(res.headers.get("access-control-allow-origin"), PAGES, "ACAO");
  const methods = list(res.headers.get("access-control-allow-methods")).map((m) =>
    m.toUpperCase()
  );
  ok(
    ["GET", "POST", "OPTIONS"].every((m) => methods.includes(m)),
    `Allow-Methods covers GET, POST and OPTIONS; got ${methods.join(",")}`
  );
  const headers = list(res.headers.get("access-control-allow-headers")).map((h) =>
    h.toLowerCase()
  );
  /* Named explicitly: a browser ignores a "*" wildcard for Authorization. */
  ok(headers.includes("authorization"), `Allow-Headers names Authorization; got ${headers.join(",")}`);
  ok(headers.includes("content-type"), `Allow-Headers names Content-Type; got ${headers.join(",")}`);
});

await test("5.7 a preflight from an unlisted origin gets no ACAO", async () => {
  const res = await send(seeded(), "OPTIONS", "/ledger", {
    origin: STRANGER,
    headers: { "Access-Control-Request-Method": "POST" },
  });
  eq(res.headers.get("access-control-allow-origin"), null, "ACAO");
});

/* ---------- 6. routing ---------- */
await test("6.1 an unknown path is 404 for a device with a good key", async () => {
  const res = await send(seeded(), "GET", "/nope", { key: KEY_PHONE });
  eq(res.status, 404, "status");
});

await test("6.2 PUT, PATCH and DELETE on /ledger are 405 for a device with a good key", async () => {
  for (const m of ["PUT", "PATCH", "DELETE"]) {
    const res = await send(seeded(), m, "/ledger", { key: KEY_PHONE });
    eq(res.status, 405, `${m} status`);
  }
});

/* ---------- 7. one merge, shared with the app ---------- */
await test("7.1 the core imports the shared merge and holds no copy of it", async () => {
  /* The one place this file reads source. It guards the rule that the app and
     the server share one merge, which a behaviour test cannot see. */
  const src = readFileSync(new URL("./core.mjs", import.meta.url), "utf8");
  ok(
    /from\s+["']\.\.\/src\/merge-rules\.mjs["']/.test(src),
    "core.mjs imports ../src/merge-rules.mjs"
  );
  ok(
    !/function\s+merge(Ledger|Items|Received|Envelopes|Stamps)\b/.test(src),
    "core.mjs defines a merge function of its own"
  );
});

/* ---------- 8. WebSocket upgrade: the key rides in Sec-WebSocket-Protocol ---------- */
/* A browser's new WebSocket(url, ["mailaudit", key]) sends one header,
   "mailaudit, <key>". wsAuthorized reads that header and nothing else, so
   these build the upgrade request the same way. */
const wsReq = (protocol) =>
  new Request(BASE + "/ws", {
    headers: protocol === undefined ? {} : { "Sec-WebSocket-Protocol": protocol },
  });
const wsAuth = (protocol) => wsAuthorized(wsReq(protocol), ENV);

await test("8.1 the right key in the second protocol is authorized", async () => {
  eq(await wsAuth(`mailaudit, ${KEY_PHONE}`), true, "first listed key");
  eq(await wsAuth(`mailaudit, ${KEY_LAPTOP}`), true, "second listed key");
});

await test("8.2 a wrong key in the second protocol is refused", async () => {
  eq(await wsAuth(`mailaudit, ${KEY_STRANGER}`), false, "stranger key");
});

await test("8.3 no Sec-WebSocket-Protocol header, or an empty one, is refused", async () => {
  eq(await wsAuth(undefined), false, "no header");
  eq(await wsAuth(""), false, "empty header");
});

await test("8.4 mailaudit alone, with no key, is refused", async () => {
  eq(await wsAuth("mailaudit"), false, "name only");
});

await test("8.5 the key in the first position is refused", async () => {
  eq(await wsAuth(`${KEY_PHONE}, mailaudit`), false, "key, then name");
});

await test("8.6 a valid key under any other protocol name is refused", async () => {
  eq(await wsAuth(`chat, ${KEY_PHONE}`), false, "name is not mailaudit");
});

await test("8.7 a key list with extra entries is refused", async () => {
  eq(await wsAuth(`mailaudit, ${KEY_PHONE}, ${KEY_LAPTOP}`), false, "two keys");
  eq(await wsAuth(`mailaudit, ${KEY_PHONE}, junk`), false, "key and a stray entry");
});

await test("8.8 the stored hash of a key, used as the key, is refused", async () => {
  eq(await wsAuth(`mailaudit, ${sha256(KEY_PHONE)}`), false, "hash as key");
});

await test("8.9 wsAuthorized returns a bare boolean, so no key can come back in its result", async () => {
  for (const k of [KEY_PHONE, KEY_STRANGER]) {
    for (const p of [`mailaudit, ${k}`, `${k}, mailaudit`, `mailaudit, ${k}, junk`]) {
      const res = await wsAuth(p);
      ok(res === true || res === false, `${p}: returned ${typeof res}, not a boolean`);
    }
  }
});

/* ---------- 9. the size guard: the merged ledger, in bytes ---------- */
/* route() refuses a merged ledger whose JSON is over MAX_LEDGER_BYTES. That
   constant need not be a whole number of bytes, so LIM floors it. LIM is the
   largest size the guard accepts. Sizes use the core's own measure: TextEncoder
   over JSON.stringify. */
const LIM = Math.floor(MAX_LEDGER_BYTES);
const bytes = (v) => new TextEncoder().encode(JSON.stringify(v)).length;

/* A ledger whose JSON is exactly n bytes: one item, its name padded with
   ASCII. ASCII is one byte a character, and JSON leaves it unescaped. */
function sized(n, key = "100|9|999") {
  const base = bytes(ledger({ items: [item(key, "")] }));
  return ledger({ items: [item(key, "x".repeat(n - base))] });
}

await test("9.1 a merged ledger over the limit gets 413 too-large, and nothing is written or broadcast", async () => {
  const over = sized(LIM + 1);
  eq(bytes(over), LIM + 1, "fixture: LIM + 1 bytes");
  ok(bytes(mergeLedger(ledger(), over).merged) > LIM, "fixture: merged with the stored ledger is over");
  for (const [name, mk] of [
    ["stored", seeded],
    ["empty", empty],
  ]) {
    const s = mk();
    const before = canon(s.state);
    const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, origin: PAGES, json: { ledger: over } });
    eq(res.status, 413, `${name}: status`);
    eq(await res.json(), { error: "too-large" }, `${name}: body`);
    eq(res.headers.get("Access-Control-Allow-Origin"), PAGES, `${name}: CORS header on the 413`);
    eq(s.writes.length, 0, `${name}: writes`);
    eq(s.broadcasts.length, 0, `${name}: broadcasts`);
    ok(canon(s.state) === before, `${name}: stored state unchanged`);
  }
});

await test("9.2 a ledger just under the limit is accepted and written at rev 1", async () => {
  const under = sized(LIM);
  eq(bytes(under), LIM, "fixture: LIM bytes");
  const s = empty();
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, origin: PAGES, json: { ledger: under } });
  eq(res.status, 200, "status");
  eq(s.writes.length, 1, "writes");
  eq(s.writes[0]?.rev, 1, "write rev");
  ok(canon(s.writes[0]?.ledger) === canon(under), "written ledger is the posted one");
  eq(s.broadcasts, [{ rev: 1 }], "broadcast");
});

await test("9.3 the limit is checked on the merged ledger: a small incoming that crosses it with a large stored ledger gets 413", async () => {
  const stored = sized(LIM - 500, "900|1|001");
  const incoming = ledger({ items: [item("900|2|002", "y".repeat(1000))] });
  eq(bytes(stored), LIM - 500, "fixture: stored is under the limit");
  ok(bytes(incoming) < LIM, "fixture: incoming alone is under the limit");
  ok(bytes(mergeLedger(stored, incoming).merged) > LIM, "fixture: the merge is over the limit");
  const s = fakeStore({ ledger: stored, rev: 3 });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, origin: PAGES, json: { ledger: incoming } });
  eq(res.status, 413, "status");
  eq(await res.json(), { error: "too-large" }, "body");
  eq(res.headers.get("Access-Control-Allow-Origin"), PAGES, "CORS header on the 413");
  eq(s.writes.length, 0, "writes");
  eq(s.broadcasts.length, 0, "broadcasts");
  ok(canon(s.state) === canon({ ledger: stored, rev: 3 }), "stored state unchanged");
});

/* "é" is one character and two UTF-8 bytes, and JSON.stringify leaves it
   unescaped. So a ledger can be under the limit in characters and over it in
   bytes. A measure that counts characters would accept it. */
const chars = (v) => JSON.stringify(v).length;

await test("9.4 the limit counts UTF-8 bytes, not characters: a ledger under it in characters and over it in bytes gets 413", async () => {
  const key = "100|9|998";
  const need = LIM + 1 - bytes(ledger({ items: [item(key, "")] }));
  const name = "é".repeat(need >> 1) + (need % 2 ? "x" : "");
  const incoming = ledger({ items: [item(key, name)] });
  eq(bytes(incoming), LIM + 1, "fixture: incoming is LIM + 1 bytes");
  for (const [label, mk, stored] of [
    ["stored", seeded, ledger()],
    ["empty", empty, null],
  ]) {
    const merged = stored ? mergeLedger(stored, incoming).merged : incoming;
    ok(bytes(merged) > LIM, `${label}: fixture: merged is over the limit in bytes`);
    ok(chars(merged) <= LIM, `${label}: fixture: merged is under the limit in characters`);
    const s = mk();
    const before = canon(s.state);
    const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, origin: PAGES, json: { ledger: incoming } });
    eq(res.status, 413, `${label}: status`);
    eq(await res.json(), { error: "too-large" }, `${label}: body`);
    eq(s.writes.length, 0, `${label}: writes`);
    eq(s.broadcasts.length, 0, `${label}: broadcasts`);
    ok(canon(s.state) === before, `${label}: stored state unchanged`);
  }
});

await test("9.5 the limit leaves at least 100,000 bytes under the Durable Object's 2,000,000-byte value cap", async () => {
  ok(MAX_LEDGER_BYTES <= 1_900_000, `MAX_LEDGER_BYTES is ${MAX_LEDGER_BYTES}, over 1,900,000`);
});

/* ---------- 10. rev and broadcast: only a change raises rev and signals ---------- */
/* route() signals index.mjs by calling store.broadcast after store.write.
   There is no flag in its return value, so these tests pin the store calls. */
/* The seven counts mergeLedger reports. A no-op merge gives all zero. Their
   one home is mergeLedger, so the zeros come from it. */
const ZERO_STATS = mergeLedger({}, {}).stats;
await test("10.1 a POST whose merge equals the stored ledger keeps rev, writes nothing and sends no broadcast", async () => {
  const K = "100|1|555";
  const stored = ledger({
    received: { [K]: 1 },
    receivedAt: { [K]: 100 },
    envelopes: [{ id: "env-x", createdAt: 1, updatedAt: 1 }],
    stamps: { "111::Seller A": { kind: "refunded", updatedAt: 3 } },
  });
  ok(
    canon(mergeLedger(clone(stored), clone(stored)).merged) === canon(stored),
    "fixture: merging the stored ledger with itself returns it"
  );
  const s = fakeStore({ ledger: stored, rev: 3 });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: stored } });
  eq(res.status, 200, "status");
  eq(s.writes.length, 0, "store write calls");
  eq(s.broadcasts.length, 0, "broadcast calls");
  eq(s.state.rev, 3, "stored rev");
  eq((await res.json()).rev, 3, "response rev");
});

await test("10.2 a POST to an empty store stores the ledger exactly as sent, at rev 1", async () => {
  const K = "100|1|555";
  const incoming = ledger({
    received: { [K]: 1 },
    receivedAt: { [K]: 100 },
    envelopes: [{ id: "env-x", createdAt: 1, updatedAt: 1 }],
    stamps: { "111::Seller A": { kind: "", updatedAt: 9 } },
  });
  const s = empty();
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: incoming } });
  eq(res.status, 200, "status");
  eq(s.writes.length, 1, "store write calls");
  eq(s.writes[0]?.ledger, incoming, "stored ledger, as sent");
  eq(s.writes[0]?.rev, 1, "stored rev");
  const body = await res.json();
  eq(body.ledger, incoming, "response ledger, as sent");
  eq(body.rev, 1, "response rev");
  eq(body.stats, ZERO_STATS, "response stats: no merge ran, so zero");
});

await test("10.3 a POST that changes the stored ledger writes rev 4, then broadcasts {rev: 4}", async () => {
  const K = "100|1|555";
  const stored = ledger({ receivedAt: {} });
  const incoming = ledger({ received: { [K]: 1 }, receivedAt: { [K]: 50 } });
  ok(
    canon(mergeLedger(clone(stored), clone(incoming)).merged) !== canon(stored),
    "fixture: the merge changes the stored ledger"
  );
  const s = fakeStore({ ledger: stored, rev: 3 });
  const res = await send(s, "POST", "/ledger", { key: KEY_LAPTOP, json: { ledger: incoming } });
  eq(res.status, 200, "status");
  eq(s.writes.map((w) => w.rev), [4], "write rev");
  eq(s.broadcasts, [{ rev: 4 }], "broadcast");
  eq(s.order, ["write", "broadcast"], "order");
  eq((await res.json()).rev, 4, "response rev");
});

/* ---------- 11. the reply carries stats: the counts of this merge ---------- */
await test("11.1 a POST that changes the stored ledger replies with the stats of that merge", async () => {
  const K = "100|1|555";
  const stored = ledger({ items: [item(K, "Alpha Card", 2)] });
  const incoming = ledger({
    items: [item(K, "Alpha Card", 2), item("100|2|556", "Beta Card", 1)],
    received: { [K]: 1 },
    receivedAt: { [K]: 50 },
  });
  const expected = mergeLedger(clone(stored), clone(incoming)).stats;
  ok(expected.itemsAdded + expected.checkInsAdded > 0, "fixture: this merge adds an item and a check-in");
  const s = fakeStore({ ledger: stored, rev: 3 });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: incoming } });
  eq(res.status, 200, "status");
  eq((await res.json()).stats, expected, "reply stats");
});

await test("11.2 a POST that changes nothing replies with zero stats and keeps rev", async () => {
  const K = "100|1|555";
  const stored = ledger({
    received: { [K]: 1 },
    receivedAt: { [K]: 100 },
    envelopes: [{ id: "env-x", createdAt: 1, updatedAt: 1 }],
    stamps: { "111::Seller A": { kind: "refunded", updatedAt: 3 } },
  });
  ok(
    canon(mergeLedger(clone(stored), clone(stored)).stats) === canon(ZERO_STATS),
    "fixture: merging the stored ledger with itself counts nothing"
  );
  const s = fakeStore({ ledger: stored, rev: 3 });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: stored } });
  eq(res.status, 200, "status");
  eq(s.writes.length, 0, "store write calls");
  eq((await res.json()).stats, ZERO_STATS, "reply stats");
});

await test("11.3 the reply counts an un-check in checkInsRemoved, as mergeLedger does", async () => {
  const K = "100|1|555";
  const stored = ledger({ received: { [K]: 1 }, receivedAt: { [K]: 100 } });
  const incoming = ledger({ received: {}, receivedAt: { [K]: 200 } });
  const expected = mergeLedger(clone(stored), clone(incoming)).stats;
  ok(expected.checkInsRemoved >= 1, "fixture: this merge un-checks one card");
  const s = fakeStore({ ledger: stored, rev: 4 });
  const res = await send(s, "POST", "/ledger", { key: KEY_LAPTOP, json: { ledger: incoming } });
  eq(res.status, 200, "status");
  eq((await res.json()).stats, expected, "reply stats");
});

/* Ruling: a first POST to an empty store replies with zero stats, because no
   merge runs and so there are no counts to report. The stats-in-reply rule
   lives in sync-revamp-cloudflare (lane W1). */
await test("11.4 a first POST to an empty store replies with zero stats", async () => {
  const s = empty();
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: ledger() } });
  eq(res.status, 200, "status");
  eq((await res.json()).stats, ZERO_STATS, "reply stats");
});

/* ---------- 12. photos: write-once blobs beside the ledger, never in it ---------- */
/* Group 11 is the W1 stats group on main, so the photo route takes group 12.
   Ids are pho-<tag>; the name carries the type, so mime comes from the name. */
await test("12.1 GET /photos on an empty store replies 200 with no ids", async () => {
  const s = empty();
  const res = await sendPhoto(s, "GET", "/photos", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  eq((await res.json()).ids, [], "ids");
});

await test("12.2 GET /photos lists the ids of every stored photo", async () => {
  const s = empty();
  s.photos.set("pho-aaa111", { mime: "image/jpeg", bytes: PHO_JPG });
  s.photos.set("pho-bbb222", { mime: "image/png", bytes: PHO_OTHER });
  const res = await sendPhoto(s, "GET", "/photos", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  eq(((await res.json()).ids || []).slice().sort(), ["pho-aaa111", "pho-bbb222"], "ids");
});

await test("12.3 a POST stores the bytes, and GET serves them with the type from the name", async () => {
  const s = empty();
  const up = await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_PHONE, bytes: PHO_JPG });
  ok(up.status >= 200 && up.status < 300, `upload status ${up.status} is 2xx`);
  const got = await sendPhoto(s, "GET", "/photos/pho-aaa111.jpg", { key: KEY_PHONE });
  eq(got.status, 200, "status");
  eq(got.headers.get("Content-Type"), "image/jpeg", "content type from the name");
  eq(Array.from(new Uint8Array(await got.arrayBuffer())), Array.from(PHO_JPG), "bytes");
});

await test("12.4 a .heic photo is served as image/heic, whatever type the upload claimed", async () => {
  const s = empty();
  await sendPhoto(s, "POST", "/photos/pho-ccc333.heic", { key: KEY_PHONE, bytes: PHO_OTHER, type: "image/jpeg" });
  const got = await sendPhoto(s, "GET", "/photos/pho-ccc333.heic", { key: KEY_PHONE });
  eq(got.status, 200, "status");
  eq(got.headers.get("Content-Type"), "image/heic", "content type from the name");
});

await test("12.5 a name that is not pho-id plus a known extension is refused with 400 and stores nothing", async () => {
  for (const name of ["notes.jpg", "pho-aaa111.exe", "pho-aaa111"]) {
    const s = empty();
    const res = await sendPhoto(s, "POST", `/photos/${name}`, { key: KEY_PHONE, bytes: PHO_JPG });
    eq(res.status, 400, `status for ${name}`);
    eq(s.photos.size, 0, `photos stored for ${name}`);
  }
});

await test("12.6 a second POST to the same name keeps the first bytes", async () => {
  const s = empty();
  await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_PHONE, bytes: PHO_JPG });
  const again = await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_LAPTOP, bytes: PHO_OTHER });
  ok(again.status >= 200 && again.status < 300, `repeat status ${again.status} is 2xx`);
  const kept = s.photos.get("pho-aaa111");
  eq(kept ? Array.from(kept.bytes) : null, Array.from(PHO_JPG), "stored bytes after the repeat");
});

await test("12.7 a photo over MAX_PHOTO_BYTES is refused with 413 photo-too-large; one at the limit is kept", async () => {
  ok(typeof MAX_PHOTO_BYTES === "number", "worker/core.mjs exports MAX_PHOTO_BYTES");
  if (typeof MAX_PHOTO_BYTES !== "number") return;
  const LIM = MAX_PHOTO_BYTES;
  eq(LIM, 1_900_000, "limit is 1.9 MB");
  const s = empty();
  const over = await sendPhoto(s, "POST", "/photos/pho-big111.jpg", { key: KEY_PHONE, bytes: new Uint8Array(LIM + 1) });
  eq(over.status, 413, "status over the limit");
  eq((await over.json()).error, "photo-too-large", "error over the limit");
  eq(s.photos.size, 0, "nothing stored over the limit");
  const at = await sendPhoto(s, "POST", "/photos/pho-big222.jpg", { key: KEY_PHONE, bytes: new Uint8Array(LIM) });
  ok(at.status >= 200 && at.status < 300, `status at the limit ${at.status} is 2xx`);
  eq(s.photos.has("pho-big222"), true, "stored at the limit");
});

await test("12.8 there is no delete route: DELETE on a photo or the list replies 405 and keeps the bytes", async () => {
  const s = empty();
  await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_PHONE, bytes: PHO_JPG });
  eq((await sendPhoto(s, "DELETE", "/photos/pho-aaa111.jpg", { key: KEY_PHONE })).status, 405, "DELETE on a photo");
  eq((await sendPhoto(s, "DELETE", "/photos", { key: KEY_PHONE })).status, 405, "DELETE on the list");
  eq(s.photos.has("pho-aaa111"), true, "photo kept");
});

await test("12.9 a photo POST writes no ledger, sends no broadcast and leaves rev alone", async () => {
  const s = fakeStore({ ledger: ledger(), rev: 3 });
  const before = canon(s.state);
  const res = await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_PHONE, bytes: PHO_JPG });
  ok(res.status >= 200 && res.status < 300, `status ${res.status} is 2xx`);
  eq(s.writes.length, 0, "ledger writes");
  eq(s.broadcasts.length, 0, "broadcasts");
  eq(canon(s.state), before, "stored ledger and rev");
});

await test("12.10 photo routes need a device key, and a missing id replies 404", async () => {
  const s = empty();
  s.photos.set("pho-aaa111", { mime: "image/jpeg", bytes: PHO_JPG });
  const good = await sendPhoto(s, "POST", "/photos/pho-ddd444.jpg", { key: KEY_LAPTOP, bytes: PHO_OTHER });
  ok(good.status >= 200 && good.status < 300, `positive control: keyed POST is 2xx, got ${good.status}`);
  eq((await sendPhoto(s, "POST", "/photos/pho-bbb222.jpg", { bytes: PHO_OTHER })).status, 401, "POST without a key");
  eq(s.photos.has("pho-bbb222"), false, "nothing stored without a key");
  eq((await sendPhoto(s, "GET", "/photos", {})).status, 401, "GET list without a key");
  eq((await sendPhoto(s, "GET", "/photos/pho-aaa111.jpg", {})).status, 401, "GET photo without a key");
  eq((await sendPhoto(s, "GET", "/photos", { key: KEY_STRANGER })).status, 401, "GET list with a key not on the list");
  eq((await sendPhoto(s, "GET", "/photos/pho-zzz999.jpg", { key: KEY_PHONE })).status, 404, "missing id");
});

report();
