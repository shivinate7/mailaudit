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
import Papa from "papaparse";
import { mergeLedger } from "../src/merge-rules.mjs";
import { salvageLedger, parseItems } from "../src/view-rules.mjs";

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

/* Clock. route() takes `now` as epoch milliseconds. PREV is the stored
   state's last write; NOW is the clock send() uses by default. Both are UTC. */
const DAY = 864e5;
const PREV = Date.UTC(2026, 9, 11, 18, 0);
const NOW = Date.UTC(2026, 9, 12, 9, 0);
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

/* Store contract the Durable Object store in index.mjs must match. The fake
   takes and returns plain objects; turning the ledger into TEXT is the
   Durable Object's job. `at` is compared with new Date(at).getTime(), so
   the format (ISO string or epoch ms) is not pinned here.
     read() -> {ledger, rev, at} | null
     write(ledger, rev, at)               replaces the ledger row
     broadcast(obj)
     hasSnapshot(day) -> boolean
     writeSnapshot(day, {ledger, rev, at})
     readSnapshot(day) -> {ledger, rev, at} | null
     listSnapshots() -> [{day, rev, at}]  no ledger bodies, any order
     pruneSnapshots(beforeDay)            drops days before beforeDay
     writeKept(at, {ledger, rev})         keeps a damaged original, keyed by ISO time
     readKept(at) -> {ledger, rev} | null
     listKept() -> [{at, rev}]            no ledger bodies
     pruneKept(beforeDay)                 drops kept rows whose day is before beforeDay
     readOrdersStatus() -> {lastSuccessAt, lastFailure: {kind, at} | null, complete} | null
     writeOrdersStatus(status)            the orders job's last outcome (group 71-77). Its own row,
                                          never a key of the ledger. `complete` is true only when the
                                          run reached an all-known page or the end of history.
   The fake's `order` records "snapshot", "kept", "write" and "broadcast". Prune is
   not recorded there. */
/* initial is {ledger, rev, at?} or null for an empty store. A missing `at`
   defaults to PREV. snaps is [[day, {ledger, rev, at}], ...]. */
/* initial is {ledger, rev} or null for an empty store. The photo half of the
   store is three methods, named here as the contract the Durable Object
   adapter (worker/index.mjs) must provide:
     photoList()            -> [{id, mime}, ...]   (the mime rides on the row, so a list needs no bytes)
     photoGet(id)           -> {mime, bytes} | null
     photoPut(id, mime, bytes) -> void   (the route, not the store, enforces write-once)
   photoWrites counts every photoPut call, so a route that writes twice shows.
   photoGets counts every photoGet call, so a list that reads bytes shows. */
function fakeStore(initial = null, snaps = [], status = null) {
  const s = {
    state: initial ? clone({ at: PREV, ...initial }) : null,
    status: status ? clone(status) : null,
    statusWrites: [],
    writes: [],
    broadcasts: [],
    order: [],
    snaps: new Map(snaps.map(([day, v]) => [day, clone(v)])),
    snapWrites: [],
    photos: new Map(),
    photoWrites: [],
    photoGets: [],
  };
  s.photoList = async () => [...s.photos.entries()].map(([id, p]) => ({ id, mime: p.mime }));
  s.photoGet = async (id) => {
    s.photoGets.push(id);
    const p = s.photos.get(id);
    return p ? { mime: p.mime, bytes: p.bytes.slice() } : null;
  };
  s.photoPut = async (id, mime, bytes) => {
    s.photoWrites.push(id);
    s.photos.set(id, { mime, bytes: new Uint8Array(bytes) });
  };
  s.read = async () => (s.state ? clone(s.state) : null);
  s.write = async (l, rev, at) => {
    s.order.push("write");
    s.writes.push({ ledger: clone(l), rev, at });
    s.state = { ledger: clone(l), rev, at };
  };
  s.broadcast = async (obj) => {
    s.order.push("broadcast");
    s.broadcasts.push(clone(obj));
  };
  s.hasSnapshot = async (day) => s.snaps.has(day);
  s.writeSnapshot = async (day, snap) => {
    s.order.push("snapshot");
    s.snapWrites.push({ day, ...clone(snap) });
    s.snaps.set(day, clone(snap));
  };
  s.readSnapshot = async (day) => (s.snaps.has(day) ? clone(s.snaps.get(day)) : null);
  s.listSnapshots = async () => [...s.snaps].map(([day, v]) => ({ day, rev: v.rev, at: v.at }));
  s.pruneSnapshots = async (beforeDay) => {
    for (const day of [...s.snaps.keys()]) if (day < beforeDay) s.snaps.delete(day);
  };
  s.kept = new Map();
  s.keptWrites = [];
  s.writeKept = async (at, v) => {
    s.order.push("kept");
    s.keptWrites.push({ at, ...clone(v) });
    s.kept.set(at, clone(v));
  };
  s.readKept = async (at) => (s.kept.has(at) ? clone(s.kept.get(at)) : null);
  s.listKept = async () => [...s.kept].map(([at, v]) => ({ at, rev: v.rev }));
  s.pruneKept = async (beforeDay) => {
    for (const at of [...s.kept.keys()]) if (at.slice(0, 10) < beforeDay) s.kept.delete(at);
  };
  s.readOrdersStatus = async () => (s.status ? clone(s.status) : null);
  s.writeOrdersStatus = async (v) => {
    s.statusWrites.push(clone(v));
    s.status = clone(v);
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

/* o.now sets the clock for one call; every call defaults to NOW. */
const send = (store, method, path, o = {}) =>
  route(req(method, path, o), ENV, store, o.now ?? NOW);

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

/* 67. The Worker refuses a ledger whose received, receivedAt, stamps or envelopes has
   the wrong shape, whole field or one entry, so one app's bug cannot reach the other
   device (owner ruling 2026-10-12, "Keep a copy, then go on"). An absent field is not
   damage. Records: saved-state-shape, native-ledger-is-raw-json. */
const SHAPE_67 = [
  { received: "x" },
  { received: [] },
  { received: null },
  { received: 7 },
  { receivedAt: "x" },
  { receivedAt: null },
  { stamps: [] },
  { stamps: null },
  { envelopes: {} },
  { envelopes: null },
  { received: { "100|1|555": "x" } },
  { receivedAt: { "100|1|555": null } },
  { stamps: { "100::Seller": "x" } },
  { envelopes: ["x"] },
  { envelopes: [[1]] },
];
await test("67.1 a ledger with a received, receivedAt, stamps or envelopes of the wrong shape gets 400 and stores nothing, on a stored or an empty store", async () => {
  for (const [i, over] of SHAPE_67.entries()) {
    const body = { key: KEY_PHONE, json: { ledger: ledger(over) } };
    const s = seeded();
    const before = clone(s.state);
    const res = await send(s, "POST", "/ledger", body);
    eq(res.status, 400, `bad shape ${i}: status on a stored ledger`);
    eq(s.writes.length, 0, `bad shape ${i}: writes on a stored ledger`);
    eq(s.state, before, `bad shape ${i}: stored ledger unchanged`);
    const e = empty();
    const res2 = await send(e, "POST", "/ledger", body);
    eq(res2.status, 400, `bad shape ${i}: status on an empty store`);
    eq(e.state, null, `bad shape ${i}: empty store still empty`);
  }
});

await test("67.2 a ledger with none of the four fields is accepted, because an absent field is not damage", async () => {
  const bare = { mailday: 1, items: [item("100|1|555", "Alpha Card", 2)] };
  const s = empty();
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: bare } });
  eq(res.status, 200, "status");
  eq(s.writes.length, 1, "writes");
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
  /* The merge is the first change on NOW's UTC day, so it snapshots first (group 13). */
  eq(merge.order, ["snapshot", "write", "broadcast"], "merge order");
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
  ok(canon(s.state) === canon({ ledger: stored, rev: 3, at: PREV }), "stored state unchanged");
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
  eq(s.order, ["snapshot", "write", "broadcast"], "order");
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

/* ---------- 13. daily snapshots, /health, and the snapshot routes ---------- */
/* A snapshot is the ledger as it was before the first changing POST of a UTC
   day. A changing POST runs snapshot, then write, then broadcast. A no-op,
   a 413, a 400 and a first POST to an empty store take none. */
const withCard = (n) =>
  ledger({ items: [item("100|1|555", "Alpha Card", 2), item(`${n}|1|555`, `Card ${n}`)] });
const changes = (stored, incoming) =>
  canon(mergeLedger(clone(stored), clone(incoming)).merged) !== canon(stored);
const snapOf = (day, rev) => ({
  ledger: ledger({ received: { [day]: rev } }),
  rev,
  at: Date.parse(`${day}T12:00:00Z`),
});
/* GET /snapshots as a list of days. A non-array body fails here, not later. */
async function listDays(s) {
  const body = await (await send(s, "GET", "/snapshots", { key: KEY_PHONE })).json();
  ok(Array.isArray(body), "GET /snapshots returns an array");
  return Array.isArray(body) ? body.map((e) => e.day) : [];
}

await test("13.1 the first changing POST of a UTC day snapshots the ledger as it was before the write", async () => {
  const stored = ledger();
  ok(changes(stored, withCard(200)), "fixture: the POST changes the stored ledger");
  const s = fakeStore({ ledger: stored, rev: 3, at: PREV });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: withCard(200) } });
  eq(res.status, 200, "status");
  eq(s.snapWrites.length, 1, "snapshot writes");
  eq(s.snapWrites[0]?.day, "2026-10-12", "snapshot day");
  eq(s.snapWrites[0]?.ledger, stored, "snapshot holds the pre-write ledger");
  eq(s.snapWrites[0]?.rev, 3, "snapshot rev is the pre-write rev");
  ok(new Date(s.snapWrites[0]?.at).getTime() === PREV, "snapshot at is the pre-write write time");
  eq(s.order, ["snapshot", "write", "broadcast"], "order");
  eq(s.writes.map((w) => w.rev), [4], "write rev");
  ok(new Date(s.writes[0]?.at).getTime() === NOW, "write at is the POST's time");
});

await test("13.2 a second changing POST on the same UTC day writes no snapshot, and the first snapshot stays", async () => {
  const stored = ledger();
  const s = fakeStore({ ledger: stored, rev: 3, at: PREV });
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: withCard(200) } });
  eq(s.snapWrites.length, 1, "fixture: the first POST took the day's snapshot");
  const afterFirst = clone(s.state.ledger);
  s.order.length = 0;
  ok(changes(afterFirst, withCard(300)), "fixture: the second POST changes the ledger");
  const res = await send(s, "POST", "/ledger", {
    key: KEY_PHONE,
    now: NOW + 3 * 3600e3,
    json: { ledger: withCard(300) },
  });
  eq(res.status, 200, "status");
  eq(s.order, ["write", "broadcast"], "second POST order: no snapshot");
  eq(s.snapWrites.length, 1, "snapshot writes after the second POST");
  eq(s.snapWrites[0]?.ledger, stored, "the day's snapshot is still the pre-first-write ledger");
  eq(s.writes.map((w) => w.rev), [4, 5], "write revs");
});

await test("13.3 a changing POST on a new UTC day snapshots again, including across midnight UTC", async () => {
  const stored = ledger();
  const s = fakeStore({ ledger: stored, rev: 3, at: PREV });
  const late = Date.UTC(2026, 9, 12, 23, 59);
  const early = Date.UTC(2026, 9, 13, 0, 1);
  await send(s, "POST", "/ledger", { key: KEY_PHONE, now: late, json: { ledger: withCard(200) } });
  const afterLate = clone(s.state.ledger);
  s.order.length = 0;
  ok(changes(afterLate, withCard(300)), "fixture: the second POST changes the ledger");
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, now: early, json: { ledger: withCard(300) } });
  eq(res.status, 200, "status");
  eq(s.order, ["snapshot", "write", "broadcast"], "order on the new day");
  eq(s.snapWrites.map((w) => w.day), ["2026-10-12", "2026-10-13"], "one snapshot per UTC day");
  eq(s.snapWrites[1]?.ledger, afterLate, "the new day's snapshot is the ledger before that write");
  eq(s.snapWrites[1]?.rev, 4, "the new day's snapshot rev is the pre-write rev");
});

await test("13.4 a no-op, a 413, a 400 and a first POST to an empty store take no snapshot; a later changing POST still does", async () => {
  /* Every ledger the current app sends carries receivedAt (state at src/app.jsx ~2836). A save from before receivedAt shipped may lack it; the merge then adds {}, so the no-op looks like a change. */
  const stored = ledger({ receivedAt: {} });
  ok(!changes(stored, stored), "fixture: the no-op POST changes nothing");
  const s = fakeStore({ ledger: stored, rev: 3, at: PREV });
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: stored } });
  eq(s.snapWrites.length, 0, "no-op: snapshot writes");
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: sized(LIM + 1) } });
  eq(s.snapWrites.length, 0, "413: snapshot writes");
  for (const b of BAD_BODIES) await send(s, "POST", "/ledger", { key: KEY_PHONE, ...b });
  eq(s.snapWrites.length, 0, "400: snapshot writes");
  eq(s.writes.length, 0, "fixture: none of those wrote the ledger");
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: withCard(200) } });
  eq(s.snapWrites.length, 1, "anchor: the first changing POST of the day still snapshots once");

  const e = empty();
  await send(e, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: ledger() } });
  eq(e.snapWrites.length, 0, "empty store: snapshot writes");
  eq(e.writes.length, 1, "empty store: the ledger is still written");
});

await test("13.5 GET /snapshots lists days newest first, each with only day, rev and at", async () => {
  const days = ["2026-10-09", "2026-10-11", "2026-10-10"];
  const s = fakeStore(
    { ledger: ledger(), rev: 3, at: PREV },
    days.map((d) => [d, snapOf(d, 1)])
  );
  const res = await send(s, "GET", "/snapshots", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  const body = await res.json();
  ok(Array.isArray(body), "body is an array");
  const list = Array.isArray(body) ? body : [];
  eq(list.map((e) => e.day), ["2026-10-11", "2026-10-10", "2026-10-09"], "newest first");
  for (const e of list) eq(Object.keys(e).sort(), ["at", "day", "rev"], `keys of ${e.day}`);
  ok(!JSON.stringify(body).includes('"ledger"'), "no ledger body in the list");
  ok(new Date(list[0]?.at).getTime() === Date.parse("2026-10-11T12:00:00Z"), "at is passed through");
});

await test("13.6 GET /snapshots/<day> returns that day's ledger, rev and at; an unknown day is 404", async () => {
  const day = "2026-10-11";
  const snap = snapOf(day, 7);
  const s = fakeStore({ ledger: ledger(), rev: 3, at: PREV }, [[day, snap]]);
  const res = await send(s, "GET", `/snapshots/${day}`, { key: KEY_PHONE });
  eq(res.status, 200, "known day status");
  const body = await res.json();
  eq(body.ledger, snap.ledger, "ledger");
  eq(body.rev, 7, "rev");
  ok(new Date(body.at).getTime() === snap.at, "at");
  eq((await send(s, "GET", "/snapshots/2026-10-01", { key: KEY_PHONE })).status, 404, "unknown day status");
});

await test("13.7 both snapshot routes need the key: 401 with none or a stranger's, 200 with a device key", async () => {
  const day = "2026-10-11";
  const s = fakeStore({ ledger: ledger(), rev: 3, at: PREV }, [[day, snapOf(day, 1)]]);
  for (const path of ["/snapshots", `/snapshots/${day}`, "/snapshots/2026-10-01"]) {
    eq((await send(s, "GET", path, {})).status, 401, `${path} no key`);
    eq((await send(s, "GET", path, { key: KEY_STRANGER })).status, 401, `${path} stranger`);
  }
  eq((await send(s, "GET", "/snapshots", { key: KEY_PHONE })).status, 200, "anchor: GET /snapshots with a device key");
  eq((await send(s, "GET", `/snapshots/${day}`, { key: KEY_PHONE })).status, 200, "anchor: GET /snapshots/<day> with a device key");
});

await test("13.8 GET /health with no key returns only {at}, the last write time; a no-op does not move it", async () => {
  const s = seeded();
  const res = await send(s, "GET", "/health", {});
  eq(res.status, 200, "status");
  const body = await res.json();
  eq(Object.keys(body), ["at"], "keys: only at");
  ok(new Date(body.at).getTime() === PREV, "at is the stored state's last write time");

  await send(s, "POST", "/ledger", { key: KEY_PHONE, now: NOW, json: { ledger: withCard(200) } });
  const after = await (await send(s, "GET", "/health", {})).json();
  ok(new Date(after.at).getTime() === NOW, "after a changing POST, at is that write's time");

  const current = clone(s.state.ledger);
  ok(!changes(current, current), "fixture: the repeat POST changes nothing");
  await send(s, "POST", "/ledger", { key: KEY_PHONE, now: NOW + 3600e3, json: { ledger: current } });
  const noop = await (await send(s, "GET", "/health", {})).json();
  ok(new Date(noop.at).getTime() === NOW, "a no-op POST does not move at");
});

await test("13.9 a changing POST keeps exactly 180 snapshots: today and the 179 days before it; the 180-day-old and older go", async () => {
  /* Snapshots for 1 to 185 days ago, so the boundary and the older ones are all present. */
  const ages = Array.from({ length: 185 }, (_, i) => i + 1);
  const dayAgo = (k) => dayOf(NOW - k * DAY);
  const s = fakeStore(
    { ledger: ledger(), rev: 3, at: PREV },
    ages.map((k) => [dayAgo(k), snapOf(dayAgo(k), 1)])
  );
  ok(changes(ledger(), withCard(200)), "fixture: the POST changes the ledger");
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: withCard(200) } });
  eq(res.status, 200, "status");
  eq(s.snapWrites.map((w) => w.day), [dayOf(NOW)], "fixture: this POST takes today's snapshot");
  const days = await listDays(s);
  const kept = [dayOf(NOW), ...ages.filter((k) => k <= 179).map(dayAgo)];
  eq(days.length, 180, "exactly 180 snapshots remain");
  eq([...days].sort(), kept.sort(), "today and the 179 days before it remain");
  ok(!days.includes(dayAgo(180)), "the 180-day-old snapshot is pruned");
  ok(!days.includes(dayAgo(181)), "the 181-day-old snapshot is pruned");
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

await test("12.2 GET /photos lists every stored photo as its file name, extension included", async () => {
  const s = empty();
  s.photos.set("pho-aaa111", { mime: "image/jpeg", bytes: PHO_JPG });
  s.photos.set("pho-bbb222", { mime: "image/png", bytes: PHO_OTHER });
  const res = await sendPhoto(s, "GET", "/photos", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  eq(((await res.json()).ids || []).slice().sort(), ["pho-aaa111.jpg", "pho-bbb222.png"], "names");
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
    eq(s.photoWrites.length, 0, `photoPut calls for ${name}`);
  }
});

await test("12.6 a second POST to the same name keeps the first bytes", async () => {
  const s = empty();
  await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_PHONE, bytes: PHO_JPG });
  const again = await sendPhoto(s, "POST", "/photos/pho-aaa111.jpg", { key: KEY_LAPTOP, bytes: PHO_OTHER });
  ok(again.status >= 200 && again.status < 300, `repeat status ${again.status} is 2xx`);
  const kept = s.photos.get("pho-aaa111");
  eq(kept ? Array.from(kept.bytes) : null, Array.from(PHO_JPG), "stored bytes after the repeat");
  eq(s.photoWrites, ["pho-aaa111"], "photoPut calls: the repeat must not write again");
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
  eq(s.photoWrites.length, 0, "photoPut calls over the limit");
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

await test("12.11 a path that is not valid percent-encoding is refused with 400, never thrown, for GET and POST", async () => {
  for (const path of ["/photos/%", "/photos/%ZZ.jpg"]) {
    const s = empty();
    const got = await sendPhoto(s, "GET", path, { key: KEY_PHONE });
    eq(got.status, 400, `GET status for ${path}`);
    eq((await got.json()).error, "bad photo name", `GET error for ${path}`);
    const up = await sendPhoto(s, "POST", path, { key: KEY_PHONE, bytes: PHO_JPG });
    eq(up.status, 400, `POST status for ${path}`);
    eq(s.photoWrites.length, 0, `photoPut calls for ${path}`);
  }
});

await test("12.12 a photo is served with the mime on its stored row, not one re-derived from the URL", async () => {
  const s = empty();
  await sendPhoto(s, "POST", "/photos/pho-fff666.jpg", { key: KEY_PHONE, bytes: PHO_JPG, type: "image/png" });
  eq(s.photos.get("pho-fff666")?.mime, "image/jpeg", "row mime from the name, not the upload's claim");
  const got = await sendPhoto(s, "GET", "/photos/pho-fff666.jpg", { key: KEY_PHONE });
  eq(got.headers.get("Content-Type"), "image/jpeg", "served mime for a .jpg upload");
  s.photos.set("pho-eee555", { mime: "image/png", bytes: PHO_OTHER });
  const row = await sendPhoto(s, "GET", "/photos/pho-eee555.jpg", { key: KEY_PHONE });
  eq(row.status, 200, "status for a row stored as image/png");
  eq(row.headers.get("Content-Type"), "image/png", "served mime is the stored row's, not image/jpeg from the name");
});

await test("12.13 a POST whose Content-Length is over MAX_PHOTO_BYTES gets 413 before its body is read", async () => {
  const s = empty();
  let bodyRead = false;
  const r = {
    method: "POST",
    url: BASE + "/photos/pho-big333.jpg",
    headers: new Headers({
      Authorization: `Bearer ${KEY_PHONE}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(MAX_PHOTO_BYTES + 1),
    }),
    arrayBuffer: async () => {
      bodyRead = true;
      return new ArrayBuffer(0);
    },
  };
  const res = await route(r, ENV, s);
  eq(res.status, 413, "status");
  eq(bodyRead, false, "body read before the size check");
  eq(s.photoWrites.length, 0, "photoPut calls");
});

await test("12.14 GET /photos reads no photo bytes: zero photoGet calls, and the names still carry the extension", async () => {
  const s = empty();
  s.photos.set("pho-aaa111", { mime: "image/jpeg", bytes: PHO_JPG });
  s.photos.set("pho-bbb222", { mime: "image/png", bytes: PHO_OTHER });
  const res = await sendPhoto(s, "GET", "/photos", { key: KEY_PHONE });
  eq(res.status, 200, "status");
  eq(s.photoGets.length, 0, "photoGet calls on the list");
  eq(((await res.json()).ids || []).slice().sort(), ["pho-aaa111.jpg", "pho-bbb222.png"], "names");
});

/* 68. A stored ledger that is already damaged (saved before the shape check shipped)
   takes a POST: the POST is answered 200, the write is clean, and the original is the
   day's snapshot, kept before the write. Records: native-ledger-is-raw-json,
   saved-state-shape. */
/* Each shape here is one the head gets wrong: envelopes {} throws in the merge, and a
   stamps that is not an object, or holds a bad entry, is written back as damage. */
const STORED_68 = [
  { envelopes: {} },
  { stamps: "x" },
  { stamps: { "100::Seller": "x" } },
];
for (const [i, over] of STORED_68.entries()) {
  await test(`68.${i + 1} a stored ledger with a bad field, ${JSON.stringify(over)}, takes a POST: 200, a clean write, the original kept before the write and as the day's snapshot`, async () => {
    const damaged = ledger(over);
    const s = fakeStore({ ledger: damaged, rev: 3 });
    const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: ledger({ received: { "100|1|555": 1 } }) } });
    eq(res.status, 200, `stored ${i}: status`);
    eq(s.writes.length, 1, `stored ${i}: writes`);
    ok(salvageLedger(s.writes[0]?.ledger ?? {}).dropped === 0, `stored ${i}: the written ledger has no unreadable field`);
    eq(s.snapWrites.length, 1, `stored ${i}: snapshot writes`);
    eq(s.snapWrites[0]?.ledger, damaged, `stored ${i}: the snapshot holds the original damaged ledger`);
    eq(s.keptWrites.length, 1, `stored ${i}: kept writes`);
    eq(s.keptWrites[0]?.ledger, damaged, `stored ${i}: kept holds the original damaged ledger`);
    eq(s.order, ["kept", "snapshot", "write", "broadcast"], `stored ${i}: order`);
  });
}

/* 69. A mend keeps the damaged original in `kept`, whatever the snapshots say. The copy is
   written before the write, so a mend whose copy fails writes nothing. A healthy POST keeps
   nothing. kept rows follow the same 180-day window as snapshots. Records: saved-state-shape,
   milestones-taken-before-risk. */
const DAMAGED_69 = ledger({ envelopes: {} });
const KEPT_POST_69 = () => ({ ledger: ledger({ received: { "100|1|555": 1 } }) });

await test("69.1 a mend keeps the original in kept, before the write, even when today's snapshot already exists", async () => {
  const s = fakeStore({ ledger: DAMAGED_69, rev: 3 }, [[dayOf(NOW), snapOf(dayOf(NOW), 1)]]);
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: KEPT_POST_69() });
  eq(res.status, 200, "status");
  eq(s.snapWrites.length, 0, "fixture: today's snapshot already exists, so no snapshot is written");
  eq(s.keptWrites.length, 1, "kept writes");
  eq(s.keptWrites[0]?.ledger, DAMAGED_69, "kept holds the original damaged ledger");
  eq(s.keptWrites[0]?.rev, 3, "kept rev is the stored rev");
  ok(new Date(s.keptWrites[0]?.at).getTime() === NOW, "kept is keyed by the ISO time it was kept");
  ok(s.order.indexOf("kept") >= 0 && s.order.indexOf("kept") < s.order.indexOf("write"), "kept is written before the write");
  eq(s.writes.length, 1, "the clean write still happens");
});

await test("69.2 a healthy stored ledger takes a changing POST and keeps nothing in kept", async () => {
  const s = fakeStore({ ledger: ledger(), rev: 3 });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: withCard(200) } });
  eq(res.status, 200, "status");
  eq(s.keptWrites.length, 0, "kept writes");
  eq(s.order, ["snapshot", "write", "broadcast"], "order has no kept");
});

await test("69.3 GET /kept lists the kept row with no ledger body; GET /kept/<at> returns the original and its rev", async () => {
  const s = fakeStore({ ledger: DAMAGED_69, rev: 3 });
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: KEPT_POST_69() });
  const res = await send(s, "GET", "/kept", { key: KEY_PHONE });
  eq(res.status, 200, "list status");
  const body = await res.json();
  ok(Array.isArray(body), "list body is an array");
  const rows = Array.isArray(body) ? body : [];
  eq(rows.length, 1, "one kept row after one mend");
  eq(rows[0]?.rev, 3, "list rev");
  ok(!JSON.stringify(body).includes('"ledger"'), "no ledger body in the list");
  const at = rows[0]?.at;
  const one = await send(s, "GET", `/kept/${at}`, { key: KEY_PHONE });
  eq(one.status, 200, "GET /kept/<at> status");
  const got = await one.json();
  eq(got.ledger, DAMAGED_69, "GET /kept/<at> returns the original damaged ledger");
  eq(got.rev, 3, "GET /kept/<at> returns the rev");
  eq((await send(s, "GET", "/kept/2026-10-01T00:00:00.000Z", { key: KEY_PHONE })).status, 404, "unknown kept time is 404");
});

await test("69.4 both kept routes need the key: 401 with none or a stranger's, 200 with a device key", async () => {
  const s = fakeStore({ ledger: DAMAGED_69, rev: 3 });
  await send(s, "POST", "/ledger", { key: KEY_PHONE, json: KEPT_POST_69() });
  const at = (await (await send(s, "GET", "/kept", { key: KEY_PHONE })).json())[0]?.at;
  for (const path of ["/kept", `/kept/${at}`]) {
    eq((await send(s, "GET", path, {})).status, 401, `${path} no key`);
    eq((await send(s, "GET", path, { key: KEY_STRANGER })).status, 401, `${path} stranger`);
  }
  eq((await send(s, "GET", "/kept", { key: KEY_PHONE })).status, 200, "anchor: GET /kept with a device key");
});

await test("69.5 a mend prunes kept to 180 rows: today and the 179 days before it; the 180-day-old and older go", async () => {
  const ages = Array.from({ length: 185 }, (_, i) => i + 1);
  const keptAt = (k) => new Date(NOW - k * DAY).toISOString();
  const s = fakeStore({ ledger: DAMAGED_69, rev: 3, at: PREV });
  for (const k of ages) s.kept.set(keptAt(k), { ledger: DAMAGED_69, rev: 1 });
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: KEPT_POST_69() });
  eq(res.status, 200, "status");
  const body = await (await send(s, "GET", "/kept", { key: KEY_PHONE })).json();
  ok(Array.isArray(body), "GET /kept returns an array");
  const days = (Array.isArray(body) ? body : []).map((e) => dayOf(e.at));
  const kept = [dayOf(NOW), ...ages.filter((k) => k <= 179).map((k) => dayOf(NOW - k * DAY))];
  eq(days.length, 180, "exactly 180 kept rows remain");
  eq([...days].sort(), kept.sort(), "today and the 179 days before it remain");
  ok(!days.includes(dayOf(NOW - 180 * DAY)), "the 180-day-old kept row is pruned");
});

await test("69.6 a mend whose kept copy cannot be written writes nothing: the stored ledger is unchanged", async () => {
  const s = fakeStore({ ledger: DAMAGED_69, rev: 3 });
  s.writeKept = async () => {
    throw new Error("kept write failed");
  };
  const res = await send(s, "POST", "/ledger", { key: KEY_PHONE, json: KEPT_POST_69() }).catch((e) => e);
  ok(!(res instanceof Response) || res.status !== 200, "a failed kept write is not answered 200");
  eq(s.writes.length, 0, "no write happens after a failed kept write");
  eq(s.state?.ledger, DAMAGED_69, "the stored ledger is unchanged");
});

/* 70. A socket is told the current rev as soon as it is accepted. The Worker broadcasts {rev} only
   when a POST changes the ledger, so a socket that was down across a broadcast heard nothing on
   reconnect until the next write, and the other device sat behind for as long as that took (measured
   2026-10-20, lane web/sync-latency). The hello is the same {rev} the broadcast sends, so the client
   (app group 75.11) needs nothing new: it fetches only a rev newer than the one it holds.
   Ledger is in index.mjs, which imports cloudflare:workers and cannot load in node. It is bundled
   with esbuild, that import aliased to a stub DurableObject, as test/photoget.test.mjs bundles
   entry.jsx. The context, WebSocketPair and Response are fakes: node's Response refuses status 101. */
/* The whole bundled module, so one bundle gives both the Ledger class and the default export. */
const loadWorker = async () => {
  const { build } = await import("esbuild");
  const { mkdirSync } = await import("node:fs");
  const { pathToFileURL, fileURLToPath } = await import("node:url");
  const root = fileURLToPath(new URL("..", import.meta.url));
  const dir = `${root}node_modules/.mailday-test`;
  mkdirSync(dir, { recursive: true });
  const outfile = `${dir}/worker-index.bundle.mjs`;
  await build({
    entryPoints: [`${root}worker/index.mjs`],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "warning",
    plugins: [
      {
        name: "cloudflare-workers-stub",
        setup(b) {
          b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: "cloudflare:workers", namespace: "cf-stub" }));
          b.onLoad({ filter: /.*/, namespace: "cf-stub" }, () => ({
            contents: "export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }",
            loader: "js",
          }));
        },
      },
    ],
  });
  return import(pathToFileURL(outfile).href);
};
const loadLedger = async () => (await loadWorker()).Ledger;
/* a Durable Object context: one KV value ("state"), a SQL that returns no rows, and the sockets
   acceptWebSocket was given */
const doCtx = (state, { readThrows = false } = {}) => {
  const accepted = [];
  const kv = new Map(); /* every key but "state" lands here, so a test can read back what a store method wrote */
  const puts = []; /* every key put was called with, "state" included */
  return {
    accepted,
    kv,
    puts,
    storage: {
      sql: { exec: () => ({ toArray: () => [] }) },
      get: async (k) => {
        if (readThrows) throw new Error("storage read failed");
        return k === "state" ? state : kv.get(k);
      },
      put: async (k, v) => {
        puts.push(k);
        if (k !== "state") kv.set(k, structuredClone(v));
      },
    },
    acceptWebSocket: (ws) => accepted.push(ws),
    getWebSockets: () => accepted,
  };
};
/* runs one upgrade request through a Ledger with the fakes installed, then puts the globals back.
   readThrows: the stored ledger cannot be read. sendThrows: the accepted socket refuses a send.
   An upgrade that throws is returned as `error`, so a case can name it instead of crashing. */
const upgrade = async (state, protocol, { readThrows = false, sendThrows = false } = {}) => {
  const Ledger = await loadLedger();
  const ctx = doCtx(state, { readThrows });
  const realResponse = globalThis.Response;
  const realPair = globalThis.WebSocketPair;
  const server = {
    sent: [],
    send(m) {
      if (sendThrows) throw new Error("socket closed");
      this.sent.push(m);
    },
  };
  globalThis.WebSocketPair = class { constructor() { this[0] = { side: "client" }; this[1] = server; } };
  globalThis.Response = class { constructor(body, init = {}) { this.status = init.status ?? 200; this.webSocket = init.webSocket; } };
  try {
    let res;
    let error;
    try {
      res = await new Ledger(ctx, ENV).fetch(
        new Request(BASE + "/ws", { headers: { Upgrade: "websocket", "Sec-WebSocket-Protocol": protocol } })
      );
    } catch (e) {
      error = e;
    }
    await new Promise((r) => setTimeout(r, 0)); /* a send queued behind the response still counts */
    return { res, error, ctx, server, heard: server.sent.map((m) => JSON.parse(m)) };
  } finally {
    globalThis.Response = realResponse;
    globalThis.WebSocketPair = realPair;
  }
};

await test("70.1 a new socket is sent the stored rev as soon as it is accepted", async () => {
  const r = await upgrade({ ledger: ledger(), rev: 7, at: "2026-10-12T09:00:00.000Z" }, `mailaudit, ${KEY_PHONE}`);
  eq(r.res.status, 101, "the upgrade is accepted");
  eq(r.ctx.accepted, [r.server], "the server end of the pair is the one accepted");
  eq(r.heard, [{ rev: 7 }], "and it is told {rev: 7} once, the shape the broadcast sends");
});

await test("70.2 a store with no ledger yet still accepts the socket, and says nothing that is not a rev", async () => {
  const r = await upgrade(undefined, `mailaudit, ${KEY_PHONE}`);
  eq(r.res.status, 101, "the upgrade is accepted");
  eq(r.ctx.accepted.length, 1, "one socket accepted");
  ok(r.heard.every((m) => typeof m.rev === "number"), "whatever it is told is a numeric rev");
});

await test("70.3 a refused key gets no socket and no rev (guard: the hello waits for the key)", async () => {
  const r = await upgrade({ ledger: ledger(), rev: 7, at: "2026-10-12T09:00:00.000Z" }, `mailaudit, ${KEY_STRANGER}`);
  eq(r.res.status, 401, "refused");
  eq(r.ctx.accepted, [], "no socket accepted");
  eq(r.heard, [], "nothing sent");
});

/* 70.4 and 70.5: the hello is a courtesy. A socket that is accepted must open whatever happens to the
   hello, because the alternative is a device with no socket at all, and so no live updates, until the
   page is reloaded. Red at the lane head: the hello is built and sent before the 101 returns, and a
   throw from either step fails the upgrade. */
await test("70.4 a stored ledger that cannot be read still upgrades, and the socket is accepted", async () => {
  const r = await upgrade({ ledger: ledger(), rev: 7, at: "2026-10-12T09:00:00.000Z" }, `mailaudit, ${KEY_PHONE}`, {
    readThrows: true,
  });
  eq(r.error?.message ?? null, null, "the upgrade does not throw");
  eq(r.res?.status, 101, "the upgrade is accepted");
  eq(r.ctx.accepted, [r.server], "the server end of the pair is the one accepted");
  ok(r.heard.every((m) => typeof m.rev === "number"), "whatever it is told is a numeric rev");
});

await test("70.5 a socket that refuses the hello still upgrades", async () => {
  const r = await upgrade({ ledger: ledger(), rev: 7, at: "2026-10-12T09:00:00.000Z" }, `mailaudit, ${KEY_PHONE}`, {
    sendThrows: true,
  });
  eq(r.error?.message ?? null, null, "the upgrade does not throw");
  eq(r.res?.status, 101, "the upgrade is accepted");
  eq(r.ctx.accepted, [r.server], "the server end of the pair is the one accepted");
});

/* ---------- 71-77. the orders job: TCGplayer purchase history -> ledger ----------
   Owner ruling 2026-10-27 20:19 CDT: the Worker pulls the owner's TCGplayer purchase history on a
   schedule and merges it into the ledger, in place of the manual OrderWand CSV import. The names
   below are fixed by these tests; the page facts are from the 2026-10-27 spike.

     worker/orders.mjs
       parse(html) -> rows            OrderWand-shaped, every value a string, one row per order line,
                                      in page order. Feed them to parseItems (parser-filters has one home).
       runOrders(env, store, fetchFn, now) -> Promise
                                      Pages through order history with env.TCG_COOKIE, merges what it
                                      finds through the same path as POST /ledger, and records the outcome
                                      with store.writeOrdersStatus. It never rejects: a failed run is
                                      recorded, not thrown. fetchFn is injected; no test touches the network.
     status        {lastSuccessAt, lastFailure: {kind, at} | null, complete}, ISO strings. kind is
                   "signed-out" (a logon redirect), "no-cookie" (env.TCG_COOKIE unset or empty), "empty"
                   (a 200 first page with no orders) or "other". complete (orchestrator ruling 2026-10-27 21:46
                   CDT) is true only when the run reached an all-known page or the end of history with no
                   error. A failed run and a run cut at the page cap leave it false, and the next run
                   then pages on past all-known pages to the cap or the end. A failed run still merges
                   what it fetched first. For a line whose key is already stored, the job refreshes only
                   its tracking to the page's value; a CSV import's merge does not.
     route         GET /orders/status, Bearer-authenticated, replies with that status.
     index.mjs     default.scheduled exists, and wrangler.toml has [triggers] crons. The Durable Object's
                   readOrdersStatus/writeOrdersStatus keep the status under a storage key of its own, read
                   back as null when nothing was written.

   Every page below is synthetic: invented names and ids, and a made-up cookie. The markup follows the
   structure of the masked page sample (selectors in each builder). The listing note's real markup is
   not in that sample, so the fixture puts it in a plain element and the tests pin only that it does not
   leak into the name or the set. */
let ORD = null;
let ordersErr = "";
try {
  ORD = await import("./orders.mjs");
} catch (e) {
  ordersErr = e.message.split("\n")[0];
}
const need = (name) => {
  if (!ORD) throw new Error(`worker/orders.mjs does not load (expected until the job is built): ${ordersErr}`);
  if (typeof ORD[name] !== "function") throw new Error(`worker/orders.mjs does not export ${name}()`);
  return ORD[name];
};

const iso = (t) => new Date(t).toISOString();
const num = (v) => parseFloat(v) || 0;
const pick = (o, ks) => Object.fromEntries(ks.map((k) => [k, o[k]]));

/* new Date("October 25, 2026") is local midnight, so a parser that goes through it and toISOString
   reads the 24th east of UTC. Every parse here runs on a UTC+9 clock. */
const inZone = async (tz, fn) => {
  const was = process.env.TZ;
  process.env.TZ = tz;
  try {
    return await fn();
  } finally {
    if (was === undefined) delete process.env.TZ;
    else process.env.TZ = was;
  }
};

/* ---- page builders: div.orderWrap > div.orderHeader (three spans) + div.orderContent ---- */
const rowHtml = ({ name, set = "Test Set", cond = "Near Mint", price = "$1.00", qty = 1, pid, note = "", soldBy = "", odd = false, decoyFirst = false }) => {
  const img = decoyFirst
    ? `<img class="orderThumbnail lazy" onerror="this.src='https://img.example.invalid/product/0_25w.jpg'" src="https://img.example.invalid/product/${pid}_25w.jpg" width="21" alt="${name}"/>`
    : `<img src="https://img.example.invalid/product/${pid}_25w.jpg" data-original="https://img.example.invalid/product/${pid}_25w.jpg" width="21" onerror="this.src='https://img.example.invalid/product/0_25w.jpg'" class="orderThumbnail lazy" alt="${name}"/>`;
  return `
                        <tr class="${odd ? "trOdd" : "trEven"}">
                            <td class="orderHistoryItems">
                                    <div>
                                        ${img}
                                    </div>
                                <span style="display: block; padding-left: 30px;">
                                        <a class="nocontext" href="/magic/test-set/${pid}" title="${name}" target="_blank">${name}</a><br />

${set}
                                        ${note}
                                        ${soldBy ? `<span class="orderSoldby">Sold by <a href="/sellerprofile/${pid}">${soldBy}</a></span>` : ""}
                                </span>
                            </td>
                            <td class="orderHistoryDetail">
                                    Rarity: Rare<br />
                                    Condition: ${cond}
                            </td>
                            <td class="orderHistoryPrice" style="vertical-align:middle;">${price}</td>
                            <td class="orderHistoryQuantity" style="vertical-align:middle;">${qty}</td>
                        </tr>`;
};

/* ship / tax null leaves that summary row out, as the page does when there is none */
const orderBlock = ({ id, date = "October 25, 2026", direct = false, seller = "Acme Cards", status = "Shipped With Tracking:", ship = "$3.99", tax = "$0.62", lines }) => `
<div class="orderWrap">
    <div class="orderHeader">
        <span style="display: inline-block; width: 20%;">
            <span class="orderTitle">
                Order Date
            </span><br />
            <span data-aid="spn-orderhistory-orderdate">
                ${date}
            </span>
        </span>
        <span style="display: inline-block; width: 20%;">
            <span class="orderTitle">
                Source
            </span><br />
            <span data-aid="spn-orderhistory-source">
                TCG Marketplace
            </span>
        </span>
        <span style="display: inline-block; width: 20%;">
            <span class="orderTitle">
                     ${direct ? "TCGPLAYER DIRECT #" : "Order Number"}
            </span><br />
            ${id}
        </span>
        <span style="float: right;">
                    <input type="button" class="catalogBlueButton" value="View Order" onclick="location.href = '/myaccount/orderhistory/order/${id}?x=1'" />

         <input type="button" class="catalogBlueButton" style="margin-left: 16px;" value="Print Invoice" id="print_${id}" onclick="printOrder('Print Invoice', 'Print', '${id}', 'abc');" />
        </span>
    </div>
    <div class="orderContent">
        <span class="orderSummary">
            <span class="orderTitle">Order Summary</span><br />
            <table width="100%" data-aid="tbl-summary">
                <tr>
                    <td>Quantity:</td>
                    <td style="text-align: right">${lines.reduce((n, l) => n + (l.qty ?? 1), 0)}</td>
                </tr>
                <tr>
                    <td>Subtotal:</td>
                    <td style="text-align: right">$9.99</td>
                </tr>
                ${ship === null ? "" : `<tr>
                        <td>Shipping:</td>
                        <td style="text-align: right">${ship}</td>
                    </tr>`}
                ${tax === null ? "" : `<tr>
                    <td>
                             Sales Tax (WA):

                    </td>
                    <td style="text-align: right">
                             ${tax}
                    </td>
                </tr>`}
                <tr>
                    <td><b>Total:</b></td>
                    <td style="text-align: right"><b>$99.99</b></td>
                </tr>
            </table>
        </span>
        <span class="orderSummary breakword" data-aid="addr-ship">
                <span class="orderTitle">Ship To</span><br />
                 Test Person<br />
                 1 Test Lane<br />
                 Testville, WA 00000<br />
                 US
        </span>
        <span class="orderSummary breakword" data-aid="addr-bill">
            <span class="orderTitle">Bill To</span><br />
            Test Person<br />
            1 Test Lane<br />
            Testville, WA 00000<br />
            US
        </span>
        <span class="orderSummary breakword" style="margin-right:0px; width: 165px;white-space: normal;">
            ${
              direct
                ? `<span class="orderTitle">Sold By</span><br />
                <a href="https://help.example.invalid/direct" target="_blank">
                    <span style="font-weight: bold; float: left;"><img style="vertical-align: middle;" src="/images/logos/direct_logo_sm.png" alt="TCGplayer Direct" /></span>
                    <span style="float: left;">&nbsp;TCGplayer Direct&nbsp;</span>
                    <span class="filterIcon iconQuestion" style="float: left;"></span>
                </a><br />`
                : `<span class="orderTitle">Sold By</span><br />
                    <span data-aid="spn-orderhistory-seller">
                                <a class="nocontext" href="/sellerprofile/s1" target="_blank">${seller}</a><br />
                    </span>`
            }
            <span style="height: 8px; display: block;">&nbsp;</span>
                <span class="orderTitle" data-aid="spn-sellerorderwidget-trackingnumber">${status}</span><br />
                ${/^Shipped With/.test(status) ? `<a class="nocontext" href="https://track.example.invalid/t/0000" title="Track" target="_blank">0000000000000000</a><br />` : ""}
                     Carrier (est. delivery on November 1, 2026) - $3.99
        </span>

            <br /><br />

        <table class="orderTable" data-aid="tbl-items">
            <thead>
                <tr>
                    <th class="orderHistoryItems">Item</th>
                    <th class="orderHistoryDetail">Detail</th>
                    <th class="orderHistoryPrice">Price</th>
                    <th class="orderHistoryQuantity">Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${lines.map((l, i) => rowHtml({ ...l, odd: i % 2 === 0 })).join("")}
            </tbody>
        </table>
    </div>
</div>
<br />
`;

/* A full page. The shell holds three look-alike orders (an HTML comment, a script template literal and
   a style rule) that are not orders, and text that opens a comment or a quote. parse must skip them. */
const fakeOrder = (id) => orderBlock({ id, lines: [{ name: "FAKE", pid: 999999 }] });
const pageHtml = (...blocks) =>
  [
    "<!-- sample: page -->",
    "<!DOCTYPE html><html><head><title>Order History</title>",
    "<style type=\"text/css\">.orderWrap { border: 1px solid #ccc; } /* it's a comment */ .orderHeader > span { color: red; }</style>",
    "<script>",
    "var tpl = `",
    fakeOrder("FAKE-SCRIPT-ORDER"),
    "  it's a lone quote, a // comment opener and a /* block opener",
    "`;",
    "</script></head><body>",
    `<!-- ${fakeOrder("FAKE-COMMENT-ORDER")} -->`,
    ...blocks,
    "</body></html>",
  ].join("\n");

/* ---- the six orders of the parse tests ---- */
const OID = {
  A: "00a1bc23-4de5fa-6b789",
  B: "11b2cd34-5ef6ab-7c890",
  C: "482913-ab3k",
  D: "22c3de45-6fa7bc-8d901",
  E: "33d4ef56-7ab8cd-9e012",
  F: "44e5fa67-8bc9de-0f123",
};
const NOTE_A1 = "Ships in a toploader, thanks!";
const NOTE_A2 = "Mailed flat, no sleeve.";
const NAME_A1 = "Moe's Gambit // Fire #7 /* x */ &lt;!-- y";
const ORDER_A = orderBlock({
  id: OID.A,
  date: "October 25, 2026",
  seller: "Moe&#39;s Cards&amp;Games9",
  lines: [
    { name: NAME_A1, set: "Test Set One", cond: "Near Mint Foil", price: "$1,250.00", qty: 1, pid: 100001, note: `<em>${NOTE_A1}</em>`, decoyFirst: true },
    { name: "Plain Card", set: "Test &amp; Set Two", cond: "Lightly Played", price: "$0.25", qty: 4, pid: 100002, note: `<div style="font-size:smaller">${NOTE_A2}</div>` },
  ],
});
const ORDER_B = orderBlock({
  id: OID.B,
  date: "September 3, 2026",
  seller: "Beta Cards",
  status: "Shipped Without Tracking",
  ship: null,
  tax: null,
  lines: [{ name: "Solo Card", set: "Test Set Three", cond: "Moderately Played Reverse Holofoil", price: "$2.00", qty: 2, pid: 100003 }],
});
const ORDER_C = orderBlock({
  id: OID.C,
  date: "October 23, 2026",
  direct: true,
  lines: [
    { name: "Direct One", set: "Test Set Four", price: "$3.00", qty: 1, pid: 100004, soldBy: "Gamma Games" },
    { name: "Direct Two", set: "Test Set Five", price: "$4.00", qty: 2, pid: 100005, soldBy: "Delta Cards" },
    { name: "Direct Three", set: "Test Set Six", price: "$5.00", qty: 1, pid: 100006, soldBy: "Gamma Games" },
  ],
});
const ORDER_D = orderBlock({ id: OID.D, date: "October 21, 2026", status: "Canceled", lines: [{ name: "Canceled Card", price: "$1.50", pid: 100007 }] });
const ORDER_E = orderBlock({ id: OID.E, date: "October 22, 2026", status: "Shipping Not Confirmed", lines: [{ name: "Pending Card", price: "$1.75", pid: 100008 }] });
const ORDER_F = orderBlock({ id: OID.F, date: "October 24, 2026", status: "Shipped With Tracking", lines: [{ name: "Tracked Card", price: "$6.00", pid: 100009 }] });
const PAGE_ALL = pageHtml(ORDER_A, ORDER_B, ORDER_C, ORDER_D, ORDER_E, ORDER_F);

const COOKIE = "ASP.NET_SessionId=zzSENTINELzz; TCGAuthTicket_Production=9f8e7d6c5b4a-synthetic";
const ENVC = { ...ENV, TCG_COOKIE: COOKIE };
const TCG_HOST = "store.tcgplayer.com";
const LOGON_URL = "https://accounts.example.invalid/logon?ReturnUrl=%2Fmyaccount%2Forderhistory";
const LOGON_PAGE_HTML = `<html><body><form action="/logon" method="post"><input name="Email"><input type="password" name="Password"></form></body></html>`;

const COLS = [
  "Type", "Vendor", "Order Id", "Ordered At", "Item Number", "Product Name", "Set Name", "Condition", "Finish",
  "Price", "Quantity", "Party", "Shipping Status", "Vendor Product Id", "Shipping Amount", "Tax Amount",
];
const GRADES = ["Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"];
const parseAll = async (html = PAGE_ALL) => inZone("Asia/Tokyo", async () => need("parse")(html));
const ROW_IDS = [
  `${OID.A}#1`, `${OID.A}#2`, `${OID.B}#1`, `${OID.C}#1`, `${OID.C}#2`, `${OID.C}#3`, `${OID.D}#1`, `${OID.E}#1`, `${OID.F}#1`,
];

/* ---------- 71. parse: page HTML -> OrderWand-shaped rows ---------- */
await test("71.1 parse reads a page into one purchase row per order line, in page order, and skips look-alike orders", async () => {
  const rows = await parseAll();
  eq(rows.map((r) => `${r["Order Id"]}#${r["Item Number"]}`), ROW_IDS, "order id and 1-based line position, in page order");
  for (const r of rows) {
    for (const c of COLS) ok(typeof r[c] === "string", `${r["Order Id"]}#${r["Item Number"]} has a string ${c}`);
    eq(r.Type, "purchase", "Type");
    eq(r.Vendor, "TCG", "Vendor");
  }
  eq(
    rows.map((r) => r["Vendor Product Id"]),
    ["100001", "100002", "100003", "100004", "100005", "100006", "100007", "100008", "100009"],
    "the product id is the row image's src, not the onerror fallback (product 0), whatever the attribute order"
  );
  eq(
    rows.map((r) => r["Ordered At"]),
    ["2026-10-25", "2026-10-25", "2026-09-03", "2026-10-23", "2026-10-23", "2026-10-23", "2026-10-21", "2026-10-22", "2026-10-24"],
    "dates are ISO days, with a zero-padded day, on a UTC+9 clock"
  );
  eq(rows.map((r) => num(r.Price)), [1250, 0.25, 2, 3, 4, 5, 1.5, 1.75, 6], "Price is per unit, and $1,250.00 reads as 1250");
  eq(rows.map((r) => r.Quantity), ["1", "4", "2", "1", "2", "1", "1", "1", "1"], "Quantity");
  ok(!JSON.stringify(rows).includes("FAKE"), "an order inside an HTML comment, a script template literal or a style rule is not an order");
});

await test("71.2 a line's name and set come from their own cells; the seller's listing note leaks into neither", async () => {
  const rows = await parseAll();
  const items = parseItems(rows);
  eq(items.length, rows.length, "parseItems keeps every row");
  eq(items[0].name, "Moe's Gambit // Fire #7 /* x */ <!-- y", "an apostrophe, //, #, /* and an entity-encoded <!-- survive in the name");
  eq(items[0].set, "Test Set One", "set name of line 1");
  eq(items[0].seller, "Moe's Cards&Games9", "the seller's entities are decoded once parseItems has run");
  eq(items[1].name, "Plain Card", "name of line 2");
  eq(items[1].set, "Test & Set Two", "an entity in the set name is decoded");
  eq(items.slice(0, 2).map((i) => [i.qty, i.price]), [[1, 1250], [4, 0.25]], "qty and unit price");
  for (const [i, note] of [[0, "toploader"], [1, "sleeve"]]) {
    ok(!rows[i]["Product Name"].includes(note), `line ${i + 1}: the note is not in Product Name`);
    ok(!rows[i]["Set Name"].includes(note), `line ${i + 1}: the note is not in Set Name`);
  }
});

await test("71.3 condition and finish rebuild the cell text, and condition is one TCG grade", async () => {
  const rows = await parseAll();
  const cells = {
    [`${OID.A}#1`]: "Near Mint Foil",
    [`${OID.A}#2`]: "Lightly Played",
    [`${OID.B}#1`]: "Moderately Played Reverse Holofoil",
    [`${OID.D}#1`]: "Near Mint",
  };
  for (const r of rows) {
    const cell = cells[`${r["Order Id"]}#${r["Item Number"]}`];
    if (!cell) continue;
    eq([r.Condition, r.Finish].filter(Boolean).join(" "), cell, `${r["Order Id"]}: condition and finish together`);
    ok(GRADES.includes(r.Condition), `${r["Order Id"]}: ${r.Condition} is a TCG grade`);
  }
  ok(/foil/i.test(rows[0].Finish), "a foil line carries its finish");
  ok(!/foil/i.test(rows[1].Finish), "a non-foil line does not");
});

await test("71.4 a TCGplayer Direct order reads its seller per line and its id without the Direct label", async () => {
  const rows = (await parseAll()).filter((r) => r["Order Id"] === OID.C);
  eq(rows.map((r) => r["Item Number"]), ["1", "2", "3"], "line positions");
  eq(rows.map((r) => r.Party), ["Gamma Games", "Delta Cards", "Gamma Games"], "each line's Sold-by seller, not TCGplayer Direct");
  eq(rows.map((r) => r["Set Name"]), ["Test Set Four", "Test Set Five", "Test Set Six"], "the set name, not the Sold-by text");
  eq(rows.map((r) => r["Product Name"]), ["Direct One", "Direct Two", "Direct Three"], "names");
  const [first] = parseItems(rows);
  eq(first.key, `${OID.C}|1|100004`, "item key");
});

await test("71.5 the four shipping texts map to OrderWand's four statuses, with or without the trailing colon", async () => {
  const rows = await parseAll();
  const by = (id) => [...new Set(rows.filter((r) => r["Order Id"] === id).map((r) => r["Shipping Status"]))];
  eq(by(OID.A), ["with tracking"], "Shipped With Tracking:");
  eq(by(OID.F), ["with tracking"], "Shipped With Tracking");
  eq(by(OID.B), ["without tracking"], "Shipped Without Tracking");
  eq(by(OID.E), ["unknown"], "Shipping Not Confirmed");
  eq(by(OID.D), ["canceled"], "Canceled");
  eq(by(OID.C), ["with tracking"], "a Direct order has its status too");
});

await test("71.6 shipping and sales tax are read from the summary, and an absent row is zero", async () => {
  const rows = await parseAll();
  const first = (id) => rows.find((r) => r["Order Id"] === id);
  eq([num(first(OID.A)["Shipping Amount"]), num(first(OID.A)["Tax Amount"])], [3.99, 0.62], "Shipping: $3.99 and Sales Tax (WA): $0.62");
  eq([num(first(OID.B)["Shipping Amount"]), num(first(OID.B)["Tax Amount"])], [0, 0], "no summary row for either");
});

await test("71.7 the rows give the same item keys and fields as the OrderWand CSV import of the same orders", async () => {
  /* the CSV is what OrderWand writes for these orders (Direct keeps "Sold by X" in Set Name), read the way
     the app reads a dropped file: Papa with header and skipEmptyLines, then parseItems */
  const base = { Type: "purchase", Vendor: "TCGplayer", Currency: "USD", "Product Line": "Magic" };
  const csvRow = (o) => ({ ...base, ...o });
  const wand = [
    csvRow({ "Order Id": OID.A, "Ordered At": "2026-10-25", "Item Number": "1", "Vendor Product Id": "100001", "Product Name": NAME_A1, Price: "1250.00", Quantity: "1", Party: "Moe's Cards&amp;Games9", "Shipping Status": "with tracking" }),
    csvRow({ "Order Id": OID.A, "Ordered At": "2026-10-25", "Item Number": "2", "Vendor Product Id": "100002", "Product Name": "Plain Card", Price: "0.25", Quantity: "4", Party: "Moe's Cards&amp;Games9", "Shipping Status": "with tracking" }),
    csvRow({ "Order Id": OID.B, "Ordered At": "2026-09-03", "Item Number": "1", "Vendor Product Id": "100003", "Product Name": "Solo Card", Price: "2.00", Quantity: "2", Party: "Beta Cards", "Shipping Status": "without tracking" }),
    csvRow({ "Order Id": OID.C, "Ordered At": "2026-10-23", "Item Number": "1", "Vendor Product Id": "100004", "Product Name": "Direct One", "Set Name": "Sold by Gamma Games", Price: "3.00", Quantity: "1", Party: "Gamma Games", "Shipping Status": "with tracking" }),
    csvRow({ "Order Id": OID.C, "Ordered At": "2026-10-23", "Item Number": "2", "Vendor Product Id": "100005", "Product Name": "Direct Two", "Set Name": "Sold by Delta Cards", Price: "4.00", Quantity: "2", Party: "Delta Cards", "Shipping Status": "with tracking" }),
    csvRow({ "Order Id": OID.C, "Ordered At": "2026-10-23", "Item Number": "3", "Vendor Product Id": "100006", "Product Name": "Direct Three", "Set Name": "Sold by Gamma Games", Price: "5.00", Quantity: "1", Party: "Gamma Games", "Shipping Status": "with tracking" }),
    csvRow({ "Order Id": OID.D, "Ordered At": "2026-10-21", "Item Number": "1", "Vendor Product Id": "100007", "Product Name": "Canceled Card", Price: "1.50", Quantity: "1", Party: "Acme Cards", "Shipping Status": "canceled" }),
    csvRow({ "Order Id": OID.E, "Ordered At": "2026-10-22", "Item Number": "1", "Vendor Product Id": "100008", "Product Name": "Pending Card", Price: "1.75", Quantity: "1", Party: "Acme Cards", "Shipping Status": "unknown" }),
    csvRow({ "Order Id": OID.F, "Ordered At": "2026-10-24", "Item Number": "1", "Vendor Product Id": "100009", "Product Name": "Tracked Card", Price: "6.00", Quantity: "1", Party: "Acme Cards", "Shipping Status": "with tracking" }),
  ];
  const fields = [...new Set(wand.flatMap(Object.keys))];
  const csvText = Papa.unparse({ fields, data: wand.map((r) => fields.map((f) => r[f] ?? "")) });
  const viaCsv = parseItems(Papa.parse(csvText, { header: true, skipEmptyLines: true }).data);
  const viaPage = parseItems(await parseAll());
  const f = ["key", "orderId", "seller", "name", "qty", "price", "date", "tracking"];
  eq(viaPage.map((i) => pick(i, f)), viaCsv.map((i) => pick(i, f)), "key, order, seller, name, qty, price, date and status of every line");
  eq(viaPage.map((i) => i.key), ROW_IDS.map((s) => s.replace("#", "|")).map((s, i) => `${s}|${100001 + i}`), "keys are orderId|position|productId");
});

await test("71.8 a page with no orders gives no rows, and a cut-off order block does not throw", async () => {
  const parse = need("parse");
  eq(await parseAll(pageHtml()), [], "a page holding only look-alike orders");
  eq(await parseAll(""), [], "an empty string");
  eq(await parseAll(LOGON_PAGE_HTML), [], "a logon page");
  const cut = await parse('<div class="orderWrap"><div class="orderHeader"><span>');
  ok(Array.isArray(cut), "a block cut off mid-tag still returns an array");
});

/* ---------- the fetch stub, the job runner and the page sets used by groups 72 to 77 ---------- */
/* A stand-in for fetch that acts like the real one. A request without the session cookie gets 302 to a
   logon URL on another host. With redirect "manual" the 302 comes back as it is. With the default it is
   followed: the same headers are sent to the new URL, and the reply is that page's 200 with redirected
   set. So a job that follows the redirect shows up twice: it has no signed-out answer, and its cookie
   went to another host. `calls` records every request that went out, hops included.
     pages(n) -> html | null     the page body for PageNumber n; null is a page with no orders
     replies[n]                  {status, body, location} or {throws} to override page n */
const pageNo = (u) => Number(u.searchParams.get("PageNumber"));
function fakeTcg({ pages = () => null, replies = {}, session = COOKIE } = {}) {
  const calls = [];
  const serve = (u, cookie) => {
    if (u.host !== TCG_HOST || u.pathname !== "/myaccount/orderhistory")
      return u.host === "accounts.example.invalid" ? { status: 200, body: LOGON_PAGE_HTML } : { status: 404, body: "not here" };
    if (cookie !== session) return { status: 302, location: LOGON_URL };
    return replies[pageNo(u)] ?? { status: 200, body: pages(pageNo(u)) ?? pageHtml() };
  };
  const fetchFn = async (input, init) => {
    let req = input instanceof Request ? input : new Request(input, init);
    const mode = req.redirect;
    for (let hop = 0; hop < 5; hop++) {
      const u = new URL(req.url);
      calls.push({ host: u.host, url: u, method: req.method, cookie: req.headers.get("cookie"), redirect: mode });
      if (calls.length > 200) throw new Error("runaway: more than 200 requests");
      const spec = serve(u, req.headers.get("cookie"));
      if (spec.throws) throw spec.throws;
      const res = new Response(spec.body ?? null, { status: spec.status, headers: spec.location ? { Location: spec.location } : {} });
      if (spec.status < 300 || spec.status >= 400) {
        if (hop > 0) {
          Object.defineProperty(res, "redirected", { value: true });
          Object.defineProperty(res, "url", { value: u.href });
        }
        return res;
      }
      if (mode === "manual") return res;
      if (mode === "error") throw new TypeError("unexpected redirect");
      req = new Request(new URL(spec.location, u), { headers: req.headers });
    }
    throw new TypeError("too many redirects");
  };
  return { fetch: fetchFn, calls, pages };
}
const fetched = (site) => site.calls.filter((c) => c.host === TCG_HOST).map((c) => pageNo(c.url));
const cookieStayedHome = (site) => site.calls.filter((c) => c.cookie).every((c) => c.host === TCG_HOST);

const show = (x) => {
  if (typeof x === "string") return x;
  if (x instanceof Error) return `${x.message}\n${x.stack}`;
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
};
/* runs the job once. Console output is captured, a rejection is returned as `threw`. */
const runJob = async ({ site, store = fakeStore(null), env = ENVC, now = NOW } = {}) => {
  const runOrders = need("runOrders");
  const lines = [];
  const kept = {};
  for (const k of ["log", "info", "warn", "error", "debug", "trace"]) {
    kept[k] = console[k];
    console[k] = (...a) => void lines.push(a.map(show).join(" "));
  }
  let threw = null;
  let value;
  try {
    value = await runOrders(env, store, site.fetch, now);
  } catch (e) {
    threw = e;
  } finally {
    Object.assign(console, kept);
  }
  return { store, site, lines, threw, value };
};

/* order n has two lines, so a page of three orders has six. nItem is the ledger line the import would
   keep for it; only its key matters to "already known". */
const oid = (n) => `${String(n).padStart(8, "0")}-0a0b0c-1d2e3`;
const pid = (n, k) => 200000 + n * 10 + k;
const nOrder = (n, status) =>
  orderBlock({
    id: oid(n),
    date: "October 20, 2026",
    seller: `Seller ${n}`,
    ...(status && { status }),
    lines: [1, 2].map((k) => ({ name: `Card ${n}-${k}`, price: "$1.00", pid: pid(n, k) })),
  });
const nItem = (n, k) => ({
  key: `${oid(n)}|${k}|${pid(n, k)}`, orderId: oid(n), seller: `Seller ${n}`, name: `Card ${n}-${k}`, set: "Test Set",
  condition: "Near Mint", finish: "", qty: 1, price: 1, date: "2026-10-20", tracking: "with tracking", line: "",
});
const nKeys = (n) => [1, 2].map((k) => nItem(n, k).key);
const nItems = (ns) => ns.flatMap((n) => [1, 2].map((k) => nItem(n, k)));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/* `total` orders, `per` to a page, newest first; a page past the last has no orders */
const sitePages = (per, total) => (p) => {
  const first = (p - 1) * per + 1;
  return first > total ? null : pageHtml(...range(first, Math.min(total, first + per - 1)).map((n) => nOrder(n)));
};
/* a site with no last page: every page brings three orders nobody has seen */
const endlessPages = (p) => pageHtml(...range(p * 3 - 2, p * 3).map((n) => nOrder(n)));

const ENV_1 = { id: "env-1", createdAt: PREV, note: "n", entries: [{ name: "Card 1-1", qty: 1 }], photos: [], updatedAt: PREV };
const STAMP_1 = { kind: "claim", at: "2026-10-01", note: "", updatedAt: PREV };
/* a ledger that holds every field the import must leave alone: one check-in, one envelope, one stamp,
   and a line from before TCGplayer's 120-day window (order 99), which no page shows */
const storedLedger = () =>
  ledger({
    items: nItems([1, 99]),
    received: { [nKeys(1)[0]]: 1 },
    receivedAt: { [nKeys(1)[0]]: PREV },
    envelopes: [ENV_1],
    stamps: { [`${oid(1)}::Seller 1`]: STAMP_1 },
  });
const status0 = { lastSuccessAt: iso(PREV), lastFailure: null };
/* the two states a previous run can leave for the early stop to read */
const statusComplete = { ...status0, complete: true };
const statusGap = { ...status0, complete: false };
/* a stored line that the page shows differently in every field but its key, and whose shipping status is stale */
const staleLine = (n, k = 1) => ({
  ...nItem(n, k), seller: "Old Seller", name: "Old name", set: "Old Set", condition: "Heavily Played", finish: "Foil",
  qty: 3, price: 9.99, date: "2026-09-01", tracking: "unknown", line: "Magic",
});

/* ---------- 72. a failed pull is a recorded failure, never a quiet zero ---------- */
await test("72.1 a logon redirect on the first page is a signed-out failure, and nothing is written", async () => {
  const site = fakeTcg({ pages: sitePages(3, 9), session: "an-expired-session" });
  const store = fakeStore({ ledger: storedLedger(), rev: 3 }, [], status0);
  const before = clone(store.state);
  const r = await runJob({ site, store });
  eq(r.threw?.message ?? null, null, "the run does not reject");
  const st = await store.readOrdersStatus();
  eq(st?.lastFailure?.kind, "signed-out", "kind");
  eq(st?.lastFailure?.at, iso(NOW), "when");
  eq(st?.lastSuccessAt, iso(PREV), "a failed run leaves the last success time alone");
  eq(store.state, before, "the ledger is untouched");
  eq(store.writes.length + store.snapWrites.length + store.broadcasts.length, 0, "no write, snapshot or broadcast");
  ok(cookieStayedHome(site), "the cookie went only to store.tcgplayer.com, even when the redirect points elsewhere");
});

await test("72.2 a 503, a 403 and a failed fetch are failures of kind other, not signed-out and not success", async () => {
  const cases = [
    ["503", { status: 503, body: "Service Unavailable" }],
    ["403 challenge page", { status: 403, body: "<html><body>Just a moment...</body></html>" }],
    ["fetch rejects", { throws: new TypeError("fetch failed") }],
  ];
  for (const [label, reply] of cases) {
    const site = fakeTcg({ pages: sitePages(3, 9), replies: { 1: reply } });
    const store = fakeStore({ ledger: storedLedger(), rev: 3 }, [], status0);
    const before = clone(store.state);
    const r = await runJob({ site, store });
    eq(r.threw?.message ?? null, null, `${label}: the run does not reject`);
    const st = await store.readOrdersStatus();
    eq(st?.lastFailure?.kind, "other", `${label}: kind`);
    eq(st?.lastSuccessAt, iso(PREV), `${label}: no success is stamped`);
    eq(store.state, before, `${label}: the ledger is untouched`);
  }
});

await test("72.3 a 200 page that has no orders and is not the end of history is a failure, not a run with zero orders", async () => {
  const site = fakeTcg({ replies: { 1: { status: 200, body: LOGON_PAGE_HTML } } });
  const store = fakeStore({ ledger: storedLedger(), rev: 3 }, [], status0);
  const before = clone(store.state);
  const r = await runJob({ site, store });
  eq(r.threw?.message ?? null, null, "the run does not reject");
  const st = await store.readOrdersStatus();
  eq(typeof st?.lastFailure?.kind, "string", "a failure kind is recorded");
  eq(st?.lastSuccessAt, iso(PREV), "no success is stamped");
  eq(store.state, before, "the ledger is untouched");
});

await test("72.4 a failure on a later page is recorded, stamps no success, and drops nothing already stored", async () => {
  const site = fakeTcg({ pages: sitePages(3, 9), replies: { 2: { status: 302, location: LOGON_URL } } });
  const stored = storedLedger();
  const store = fakeStore({ ledger: stored, rev: 3 }, [], status0);
  const r = await runJob({ site, store });
  eq(r.threw?.message ?? null, null, "the run does not reject");
  const st = await store.readOrdersStatus();
  eq(st?.lastFailure?.kind, "signed-out", "kind");
  eq(st?.lastSuccessAt, iso(PREV), "a half-done run is not a success");
  const have = new Set(store.state.ledger.items.map((i) => i.key));
  ok(stored.items.every((i) => have.has(i.key)), "every stored line is still there");
  eq(store.state.ledger.received, stored.received, "the check-ins are untouched");
  ok(cookieStayedHome(site), "the cookie went only to store.tcgplayer.com");
});

await test("72.5 with no cookie in env.TCG_COOKIE no request goes out, and the failure is kind no-cookie", async () => {
  const decoys = { COOKIE: COOKIE, Cookie: COOKIE, TCG_COOKIES: COOKIE, TCG_COOKIE_OLD: COOKIE };
  for (const [label, env] of [["unset", { ...ENV, ...decoys }], ["empty", { ...ENV, ...decoys, TCG_COOKIE: "" }]]) {
    const site = fakeTcg({ pages: sitePages(3, 9) });
    const store = fakeStore({ ledger: storedLedger(), rev: 3 }, [], status0);
    const r = await runJob({ site, store, env });
    eq(r.threw?.message ?? null, null, `${label}: the run does not reject`);
    eq(site.calls.length, 0, `${label}: no request, and no other variable stands in for the cookie`);
    eq((await store.readOrdersStatus())?.lastFailure?.kind, "no-cookie", `${label}: kind`);
  }
});

await test("72.6 a 200 first page with no orders is kind empty, its own kind, and the run is a failure that is not complete", async () => {
  /* 72.3 pins that this is a failure; orchestrator ruling 2026-10-27 21:46 CDT gives it a kind of its own */
  for (const [label, body] of [["a page that lists no orders", pageHtml()], ["a logon form served with 200", LOGON_PAGE_HTML]]) {
    const site = fakeTcg({ replies: { 1: { status: 200, body } } });
    const store = fakeStore({ ledger: storedLedger(), rev: 3 }, [], statusComplete);
    const before = clone(store.state);
    const r = await runJob({ site, store });
    eq(r.threw?.message ?? null, null, `${label}: the run does not reject`);
    const st = await store.readOrdersStatus();
    eq(st?.lastFailure?.kind, "empty", `${label}: kind`);
    eq(st?.lastFailure?.at, iso(NOW), `${label}: when`);
    eq(st?.lastSuccessAt, iso(PREV), `${label}: no success is stamped`);
    eq(st?.complete, false, `${label}: a failed run is not complete`);
    eq(store.state, before, `${label}: the ledger is untouched`);
  }
});

/* ---------- 73. paging ---------- */
await test("73.1 paging stops after the first page whose orders are all already in the ledger", async () => {
  const site = fakeTcg({ pages: sitePages(3, 15) });
  const store = fakeStore({ ledger: ledger({ items: nItems(range(4, 15)) }), rev: 3 }, [], statusComplete);
  await runJob({ site, store });
  eq(fetched(site), [1, 2], "the last run was complete, so page 2 being all known ends this run before page 3");
  const keys = store.state.ledger.items.map((i) => i.key).sort();
  eq(keys, nItems(range(1, 15)).map((i) => i.key).sort(), "page 1's three orders were added, and nothing else changed");
});

await test("73.2 a page with one new order among known ones does not stop the run", async () => {
  const site = fakeTcg({ pages: sitePages(3, 9) });
  const store = fakeStore({ ledger: ledger({ items: nItems([4, 5]) }), rev: 3 });
  await runJob({ site, store });
  ok(fetched(site).includes(3), "page 3 is fetched after the mixed page 2");
  const have = new Set(store.state.ledger.items.map((i) => i.key));
  ok(nItems(range(1, 9)).every((i) => have.has(i.key)), "all nine orders are in the ledger");
});

await test("73.3 a site with no last page is cut at a page cap that keeps the run under 50 subrequests", async () => {
  const site = fakeTcg({ pages: endlessPages });
  const store = fakeStore({ ledger: storedLedger(), rev: 3 });
  const r = await runJob({ site, store });
  eq(r.threw?.message ?? null, null, "the run does not reject");
  ok(site.calls.length >= 2, `it pages past the first page (${site.calls.length} requests)`);
  ok(site.calls.length < 50, `it stays under the free plan's 50 subrequests (${site.calls.length} requests)`);
  eq(fetched(site), range(1, site.calls.length), "pages are asked for in order from 1, none twice");
  eq((await store.readOrdersStatus())?.lastSuccessAt, iso(NOW), "reaching the cap is a success");
});

await test("73.4 an empty 200 page after real pages is the end of history, and the run is a success", async () => {
  const site = fakeTcg({ pages: sitePages(3, 3) });
  const store = fakeStore({ ledger: storedLedger(), rev: 3 });
  await runJob({ site, store });
  eq(fetched(site), [1, 2], "page 2 is asked for, found empty, and the run stops");
  const st = await store.readOrdersStatus();
  eq(st?.lastSuccessAt, iso(NOW), "success time");
  ok(nKeys(2).every((k) => store.state.ledger.items.some((i) => i.key === k)), "the three orders of page 1 are in the ledger");
});

/* Orchestrator ruling 2026-10-27 21:46 CDT: the early stop on an all-known page is safe only when the last
   run covered history. A run that failed after merging page 1, or was cut at the page cap, leaves
   a gap behind a page that now looks all known. */
await test("73.5 a run that fails after merging page 1 is not complete, and the next run pages on past the now-known page 1", async () => {
  const pages = sitePages(3, 9);
  const store = fakeStore({ ledger: ledger({ items: nItems([99]) }), rev: 3 }, [], statusComplete);
  const down = fakeTcg({ pages, replies: { 2: { status: 302, location: LOGON_URL } } });
  await runJob({ site: down, store });
  eq(fetched(down), [1, 2], "fixture: page 2 is where the first run fails");
  let st = await store.readOrdersStatus();
  eq(st?.complete, false, "a failed run records complete:false, whatever the run before it was");
  eq(st?.lastFailure?.kind, "signed-out", "kind");
  eq(st?.lastSuccessAt, iso(PREV), "no success is stamped");
  const have = () => new Set(store.state.ledger.items.map((i) => i.key));
  ok(nItems([1, 2, 3]).every((i) => have().has(i.key)), "the failed run still merged the three orders of page 1, fetched before the failure");
  ok(nItems([4]).every((i) => !have().has(i.key)), "and nothing of page 2");

  const retry = fakeTcg({ pages });
  await runJob({ site: retry, store, now: NOW + DAY });
  eq(fetched(retry), [1, 2, 3, 4], "page 1 is all known, but the last run did not finish, so this run pages on to the end of history");
  ok(nItems(range(1, 9)).every((i) => have().has(i.key)), "all nine orders are in the ledger");
  st = await store.readOrdersStatus();
  eq([st?.complete, st?.lastSuccessAt], [true, iso(NOW + DAY)], "reaching the end of history is complete, and a success");

  const again = fakeTcg({ pages });
  await runJob({ site: again, store, now: NOW + 2 * DAY });
  eq(fetched(again), [1], "after a complete run, an all-known page 1 ends the run again");
  eq((await store.readOrdersStatus())?.complete, true, "reaching an all-known page is complete");
});

await test("73.6 a run cut at the page cap is a success but not complete, and the next run pages on to the cap again", async () => {
  const store = fakeStore({ ledger: ledger({ items: nItems([99]) }), rev: 3 }, [], statusComplete);
  const first = fakeTcg({ pages: endlessPages });
  await runJob({ site: first, store });
  const pagesRun = fetched(first);
  ok(pagesRun.length >= 2 && pagesRun.length < 50, `fixture: the first run is cut at a cap (${pagesRun.length} pages)`);
  let st = await store.readOrdersStatus();
  eq(st?.lastSuccessAt, iso(NOW), "73.3 holds: reaching the cap is a success");
  eq(st?.complete, false, "but the cap left history unread, so the run is not complete");
  const second = fakeTcg({ pages: endlessPages });
  await runJob({ site: second, store, now: NOW + DAY });
  eq(fetched(second), pagesRun, "pages 1 to the cap are all known now, and the run still goes on to the cap");
  eq((await store.readOrdersStatus())?.complete, false, "cut at the cap again, so still not complete");
});

await test("73.7 the early stop needs a stored complete:true: the same all-known pages end at page 1 then, and run to the end of history when it is false, missing or there is no status", async () => {
  /* "only when the previous run was complete": a status saved before the flag existed, and no status at all,
     do not say it was */
  const rows = [
    ["complete", statusComplete, [1]],
    ["not complete", statusGap, [1, 2, 3, 4]],
    ["a status with no complete key", status0, [1, 2, 3, 4]],
    ["no status yet", null, [1, 2, 3, 4]],
  ];
  for (const [label, status, want] of rows) {
    const site = fakeTcg({ pages: sitePages(3, 9) });
    const store = fakeStore({ ledger: ledger({ items: nItems(range(1, 9)) }), rev: 3 }, [], status);
    await runJob({ site, store });
    eq(fetched(site), want, `${label}: pages asked for`);
    const st = await store.readOrdersStatus();
    eq([st?.complete, st?.lastSuccessAt], [true, iso(NOW)], `${label}: the run reached an all-known page or the end, so it is complete and a success`);
  }
});

/* ---------- 74. the merge is the import's merge ---------- */
await test("74.1 the job writes what the same orders sent as an import (POST /ledger) write", async () => {
  const pages = sitePages(3, 6);
  const rows = (await need("parse")(pages(1))).concat(await need("parse")(pages(2)));
  const incoming = ledger({ items: parseItems(rows), received: {}, envelopes: [], stamps: {} });
  const viaPost = fakeStore({ ledger: storedLedger(), rev: 3 });
  const res = await send(viaPost, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: incoming } });
  eq(res.status, 200, "fixture: the import is accepted");
  const viaJob = fakeStore({ ledger: storedLedger(), rev: 3 });
  await runJob({ site: fakeTcg({ pages }), store: viaJob });
  eq(viaJob.state, viaPost.state, "stored ledger, rev and time");
  eq(viaJob.order, viaPost.order, "the same writes in the same order (snapshot, write, broadcast)");
  eq(viaJob.snapWrites, viaPost.snapWrites, "the same daily snapshot of what was there");
  eq(viaJob.broadcasts, viaPost.broadcasts, "the same broadcast");
});

await test("74.2 check-ins, envelopes, stamps and old lines survive, and the ledger gains no key", async () => {
  const stored = storedLedger();
  const store = fakeStore({ ledger: stored, rev: 3 });
  await runJob({ site: fakeTcg({ pages: sitePages(3, 6) }), store });
  const out = store.state.ledger;
  for (const k of ["received", "receivedAt", "envelopes", "stamps", "dateFilter", "sortBy", "itemSort"]) eq(out[k], stored[k], `${k} is untouched`);
  const byKey = new Map(out.items.map((i) => [i.key, i]));
  for (const it of stored.items) eq(byKey.get(it.key), it, `stored line ${it.key} is kept as it was, including order 99, which no page shows`);
  eq([...byKey.keys()].sort(), nItems([1, 2, 3, 4, 5, 6, 99]).map((i) => i.key).sort(), "stored lines plus the five new orders");
  eq(Object.keys(out).sort(), Object.keys(stored).sort(), "the status and the pull leave no new key in the ledger");
  eq((await store.read()).rev, 4, "one write, one rev");
});

await test("74.3 running the job again over the same pages changes nothing", async () => {
  const store = fakeStore({ ledger: storedLedger(), rev: 3 });
  const pages = sitePages(3, 6);
  await runJob({ site: fakeTcg({ pages }), store });
  const after = clone(store.state);
  const writes = store.writes.length;
  await runJob({ site: fakeTcg({ pages }), store, now: NOW + DAY });
  eq(store.state, after, "ledger, rev and time are as the first run left them");
  eq(store.writes.length, writes, "no second write");
  eq(store.broadcasts.length, 1, "no second broadcast");
  eq(store.snapWrites.length, 1, "no second snapshot");
  eq((await store.readOrdersStatus())?.lastSuccessAt, iso(NOW + DAY), "the second run is still a success");
});

await test("74.4 an empty store takes the pulled lines as a clean ledger", async () => {
  const store = fakeStore(null);
  const pages = sitePages(3, 3);
  await runJob({ site: fakeTcg({ pages }), store });
  const out = store.state?.ledger;
  eq(out?.mailday, 1, "mailday");
  eq(out?.items?.map((i) => i.key).sort(), nKeys(1).concat(nKeys(2), nKeys(3)).sort(), "items");
  eq(salvageLedger(out ?? {}).dropped, 0, "no field of the written ledger is unreadable");
  eq(store.state?.rev, 1, "first rev");
});

await test("74.5 the job reaches the shared parseItems, and holds no second copy of it", async () => {
  /* The job is bundled with esbuild, so a comment or a string in its source cannot fool this. Tree
     shaking drops parseItems unless the job really uses it, and a copy would add a second one.
     "Unknown seller" is a literal that only parseItems holds. */
  const { build } = await import("esbuild");
  const { fileURLToPath } = await import("node:url");
  const out = await build({
    entryPoints: [fileURLToPath(new URL("./orders.mjs", import.meta.url))],
    bundle: true, write: false, format: "esm", platform: "node", logLevel: "silent",
  });
  eq(out.outputFiles[0].text.split('"Unknown seller"').length - 1, 1, "one parseItems in the job's bundle");
});

/* Orchestrator ruling 2026-10-27 21:46 CDT: for a line whose key is already stored, the job refreshes only its
   tracking to the page's value, so "Shipping Not Confirmed" does not stay unknown after the package
   ships. Qty, price, name, set and every check-in, envelope and stamp stay. A CSV import does not change. */
await test("74.6 a stored line takes the page's shipping status and nothing else of the page; new lines are added as before", async () => {
  const stale = [staleLine(1), staleLine(2), staleLine(3)];
  const stored = storedLedger();
  stored.items = [...stale, ...stored.items.slice(1)]; /* the stale lines, then 1-2, 99-1 and 99-2 as they were */
  const page = pageHtml(nOrder(1), nOrder(2, "Canceled"), nOrder(3, "Shipped Without Tracking"), nOrder(4, "Shipped Without Tracking"));
  const store = fakeStore({ ledger: stored, rev: 3 });
  await runJob({ site: fakeTcg({ pages: (p) => (p === 1 ? page : null) }), store });
  const out = store.state.ledger;
  const got = new Map(out.items.map((i) => [i.key, i]));
  eq(got.get(stale[0].key), { ...stale[0], tracking: "with tracking" }, "unknown becomes with tracking; every other field of the stored line stays");
  eq(got.get(stale[1].key), { ...stale[1], tracking: "canceled" }, "unknown becomes canceled; every other field stays");
  eq(got.get(stale[2].key), { ...stale[2], tracking: "without tracking" }, "unknown becomes without tracking; every other field stays");
  for (const k of [nKeys(1)[1], ...nKeys(99)]) eq(got.get(k), stored.items.find((i) => i.key === k), `${k}: the page agrees or does not show it, so it is as stored`);
  const fresh = { [oid(2)]: "canceled", [oid(3)]: "without tracking", [oid(4)]: "without tracking" };
  const f = ["key", "orderId", "name", "qty", "price", "tracking"];
  for (const i of [nItem(2, 2), nItem(3, 2), nItem(4, 1), nItem(4, 2)])
    eq(pick(got.get(i.key) ?? {}, f), pick({ ...i, tracking: fresh[i.orderId] }, f), `${i.key}: a new key is added with the page's values`);
  eq(out.items.length, 10, "no line is lost, and only those four are new");
  for (const k of ["received", "receivedAt", "envelopes", "stamps", "dateFilter", "sortBy", "itemSort"]) eq(out[k], stored[k], `${k} is untouched, the check-in on a refreshed line included`);
  eq(Object.keys(out).sort(), Object.keys(stored).sort(), "the refresh leaves no new key in the ledger");
  eq((await store.read()).rev, 4, "one write, one rev");
});

await test("74.7 the all-known page that ends the run is still read: its changed shipping status is refreshed", async () => {
  const stale = staleLine(1);
  const store = fakeStore({ ledger: ledger({ items: [stale, nItem(1, 2)] }), rev: 3 }, [], statusComplete);
  const site = fakeTcg({ pages: (p) => (p === 1 ? pageHtml(nOrder(1)) : null) });
  await runJob({ site, store });
  eq(fetched(site), [1], "fixture: page 1 is all known and the last run was complete, so the run ends there");
  eq(store.state.ledger.items.find((i) => i.key === stale.key), { ...stale, tracking: "with tracking" }, "the stored line took the page's status");
});

await test("74.8 a CSV re-import still keeps the stored shipping status (POST /ledger and mergeLedger are unchanged)", async () => {
  const stale = staleLine(1);
  const stored = ledger({ items: [stale] });
  const reimport = ledger({ items: [{ ...stale, tracking: "with tracking" }] });
  eq(reimport.items[0].tracking, "with tracking", "fixture: the file carries a newer status than the ledger");
  const store = fakeStore({ ledger: stored, rev: 3 });
  const res = await send(store, "POST", "/ledger", { key: KEY_PHONE, json: { ledger: reimport } });
  eq(res.status, 200, "the import is accepted");
  eq(store.state.ledger.items, [stale], "POST /ledger: the stored line is as it was");
  eq(mergeLedger(stored, reimport).merged.items, [stale], "mergeLedger: the same, so the app's own merge is unchanged too");
});

/* ---------- 75. the status the GET reply exposes ---------- */
await test("75.1 a success records its time, a later failure records its kind and time, and the success time stays", async () => {
  const store = fakeStore({ ledger: storedLedger(), rev: 3 });
  await runJob({ site: fakeTcg({ pages: sitePages(3, 3) }), store });
  let st = await store.readOrdersStatus();
  eq(st?.lastSuccessAt, iso(NOW), "success time is the run's clock, as an ISO string");
  ok(!st?.lastFailure, "no failure yet");
  await runJob({ site: fakeTcg({ pages: sitePages(3, 3), session: "gone" }), store, now: NOW + DAY });
  st = await store.readOrdersStatus();
  eq(st?.lastFailure, { kind: "signed-out", at: iso(NOW + DAY) }, "failure kind and time");
  eq(st?.lastSuccessAt, iso(NOW), "the earlier success time is kept");
});

await test("75.2 GET /orders/status gives the stored status to a device key, and nothing to anyone else", async () => {
  const st = { lastSuccessAt: iso(PREV), lastFailure: { kind: "signed-out", at: iso(NOW) } };
  const s = fakeStore({ ledger: ledger(), rev: 3 }, [], st);
  const ok200 = await send(s, "GET", "/orders/status", { key: KEY_PHONE });
  eq(ok200.status, 200, "status");
  eq(pick(await ok200.json(), ["lastSuccessAt", "lastFailure"]), st, "the stored success time and failure");
  const fresh = await send(fakeStore({ ledger: ledger(), rev: 3 }), "GET", "/orders/status", { key: KEY_PHONE });
  eq(fresh.status, 200, "before any run: status");
  const body = await fresh.json();
  eq([body.lastSuccessAt ?? null, body.lastFailure ?? null], [null, null], "before any run: nothing recorded yet");
  const none = await send(s, "GET", "/orders/status", {});
  eq(none.status, 401, "no key");
  ok(!(await none.text()).includes("lastSuccessAt"), "and no status in the 401 body");
  eq((await send(s, "GET", "/orders/status", { key: KEY_STRANGER })).status, 401, "a key not in the list");
});

/* ---------- 76. the cookie ---------- */
await test("76.1 every request is a GET to store.tcgplayer.com order history, page 1 up, carrying env.TCG_COOKIE exactly", async () => {
  const site = fakeTcg({ pages: sitePages(3, 3) });
  await runJob({ site, store: fakeStore(null) });
  eq(site.calls.length, 2, "page 1 holds orders, page 2 is empty");
  for (const c of site.calls) {
    eq([c.host, c.url.pathname, c.method], [TCG_HOST, "/myaccount/orderhistory", "GET"], "host, path and method");
    eq(c.cookie, COOKIE, "the cookie, byte for byte");
  }
  eq(site.calls.map((c) => pageNo(c.url)), [1, 2], "PageNumber");
});

await test("76.2 the cookie is in no stored status, no reply, no log line, no ledger and no returned value, on any outcome", async () => {
  const scenarios = [
    ["a good run", { pages: sitePages(3, 6) }],
    ["a logon redirect", { pages: sitePages(3, 6), session: "gone" }],
    ["a 503 that echoes the request", { replies: { 1: { status: 503, body: `upstream error, request cookie was ${COOKIE}` } } }],
    ["a failed fetch whose message carries the header", { replies: { 1: { throws: new TypeError(`fetch failed (Cookie: ${COOKIE})`) } } }],
  ];
  for (const [label, opts] of scenarios) {
    const store = fakeStore({ ledger: storedLedger(), rev: 3 });
    const r = await runJob({ site: fakeTcg(opts), store });
    const reply = await route(req("GET", "/orders/status", { key: KEY_PHONE }), ENVC, store, NOW);
    const everything = JSON.stringify({
      status: store.status, statusWrites: store.statusWrites, state: store.state, snaps: [...store.snaps], kept: [...store.kept],
      broadcasts: store.broadcasts, lines: r.lines, value: show(r.value), threw: r.threw && show(r.threw), reply: await reply.text(),
    });
    ok(!everything.includes("zzSENTINELzz") && !everything.includes("9f8e7d6c5b4a"), `${label}: no part of the cookie is anywhere`);
  }
});

/* ---------- 77. the schedule is reachable ---------- */
await test("77.1 the Durable Object adapter keeps the orders status in its own row, never in the ledger", async () => {
  const Ledger = await loadLedger();
  const ctx = doCtx({ ledger: ledger(), rev: 7, at: "2026-10-12T09:00:00.000Z" });
  const store = new Ledger(ctx, ENV).store;
  eq([typeof store.readOrdersStatus, typeof store.writeOrdersStatus], ["function", "function"], "the two store methods exist");
  eq(await store.readOrdersStatus(), null, "nothing recorded yet reads as null");
  const st = { lastSuccessAt: iso(NOW), lastFailure: { kind: "other", at: iso(NOW) }, complete: false };
  await store.writeOrdersStatus(st);
  eq(await store.readOrdersStatus(), st, "what was written reads back");
  ok(!ctx.puts.includes("state"), "the write did not touch the ledger's row");
});

await test("77.2 the Worker has a scheduled handler", async () => {
  const mod = await loadWorker();
  eq(typeof mod.default?.scheduled, "function", "default.scheduled");
  eq(typeof mod.default?.fetch, "function", "default.fetch is still there");
});

/* One pass over TOML text: strings are set aside whole and comments dropped, so a # inside a string stays
   text and a quote inside a comment opens nothing. Returns the cron strings of the [triggers] table. */
const tomlCrons = (text) => {
  const strs = [];
  let out = "";
  for (let i = 0; i < text.length; ) {
    const rest = text.slice(i);
    const m = /^#[^\n]*/.exec(rest) || /^("""|''')[\s\S]*?\1/.exec(rest) || /^"(?:[^"\\\n]|\\.)*"/.exec(rest) || /^'[^'\n]*'/.exec(rest);
    if (m && m[0][0] === "#") i += m[0].length;
    else if (m) {
      out += `\u0001${strs.push(m[0]) - 1}\u0002`;
      i += m[0].length;
    } else out += text[i++];
  }
  const at = out.search(/^\[triggers\]/m);
  if (at < 0) return [];
  const body = out.slice(at).split(/\n(?=\[)/)[0];
  const arr = /crons\s*=\s*\[([^\]]*)\]/.exec(body);
  return arr ? [...arr[1].matchAll(/\u0001(\d+)\u0002/g)].map((x) => strs[x[1]].slice(1, -1)) : [];
};

await test("77.3 wrangler.toml declares a cron trigger (the reader skips comments and multi-line strings)", async () => {
  eq(tomlCrons('# crons = ["0 6 * * *"]\n[triggers]\n# crons = ["1 1 * * *"]\n'), [], "a commented-out crons line is not a trigger");
  eq(tomlCrons('name = "a # b"\n[triggers]\ncrons = ["0 6 * * *"] # nightly, don\'t skip\n'), ["0 6 * * *"], "a # inside a string, and a lone quote in a comment");
  eq(tomlCrons("# don't\n[triggers]\ncrons = [\n  \"0 6 * * *\",\n  \"30 18 * * *\",\n]\n"), ["0 6 * * *", "30 18 * * *"], "a lone apostrophe in a comment; a multi-line array");
  eq(tomlCrons("note = '''\n[triggers]\ncrons = [\"9 9 * * *\"]\n'''\n"), [], "a multi-line literal string is not a table");
  const crons = tomlCrons(readFileSync(new URL("./wrangler.toml", import.meta.url), "utf8"));
  ok(crons.length >= 1, "wrangler.toml has [triggers] with at least one cron");
  ok(crons.every((c) => c.trim().split(/\s+/).length === 5), `each cron has five fields (${crons.join(" | ")})`);
});

report();
