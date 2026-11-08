/* Contract tests for the browser extension's pure logic, extension/core.mjs. Run with
   `npm run test:extension`. Plain node, no framework, the same ok/eq shape as
   worker/core.test.mjs. The core takes its fetch and its DOM parser as arguments, so every
   rule here runs with no browser, no Chrome API and no network.

   The order-history site is a fake that records each request in order. A case asserts the
   requests first (the scope the result depends on), then the result. Fixtures are synthetic:
   example hosts, made-up order ids and sellers, and test values for the token and device key. */
import { JSDOM } from "jsdom";
import { failLine } from "./fail-line.mjs";

/* A missing core does not stop the run. An absent export reads as undefined, so each case
   fails on its own expected value, and the summary still counts every case. */
let core = {};
let loadNote = "";
try {
  core = await import("../extension/core.mjs");
} catch (e) {
  loadNote = e.message.split("\n")[0];
}
const call = (name, ...args) => (typeof core[name] === "function" ? core[name](...args) : undefined);

/* ---------- harness: the ok/eq/report shape of worker/core.test.mjs ---------- */
let passed = 0;
const fails = [];
class Assertion extends Error {}

/* Canonical JSON with sorted keys, so key order is not part of an expected value. */
const canon = (v) => {
  if (v === undefined) return "undefined";
  return JSON.stringify(v, (_, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))
      : x
  );
};
const show = (s) => (s.length > 200 ? `${s.slice(0, 200)}...` : s);

/* The first failed assert ends its case, so each case reports one cause. The comparison is
   on the full text; only the message is cut short. */
function eq(actual, expected, label) {
  const a = canon(actual);
  const e = canon(expected);
  if (a !== e) throw new Assertion(`${label}; expected ${show(e)}, got ${show(a)}`);
}

async function test(id, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    if (e instanceof Assertion) fails.push(`${id} ${e.message}`);
    else fails.push(`${id} threw ${e.message.split("\n")[0]}`);
  }
}

const jsonBody = (s) => {
  if (typeof s !== "string") return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return "not JSON";
  }
};

/* ---------- fixtures: synthetic only ---------- */
const BASE = "https://store.example.test";
const ORDER_URL = `${BASE}/myaccount/orderhistory`;
const WORKER = "https://orders.example.test";
const TOKEN = "synthetic-form-token-1";
const KEY = "synthetic-device-key-5c1d";
const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 8, 15, 0, 0);

const { window: domWindow } = new JSDOM("");
const parseDom = (html) => new domWindow.DOMParser().parseFromString(html, "text/html");

const row = (page, i) =>
  `<div class="orderWrap" data-order="SYN-${page}-${i}"><span class="seller">Synthetic Seller ${page}</span><span class="card">Synthetic Card ${i}</span></div>`;
/* The concatenated outer HTML a trim must return for `count` rows on `page`. */
const rows = (page, count) => Array.from({ length: count }, (_, i) => row(page, i + 1)).join("");
const CHROME = `<nav class="site-nav">Synthetic nav</nav>`;
const orderPage = (page, count) =>
  `<!doctype html><html><body>${CHROME}<div class="orders">${rows(page, count)}</div></body></html>`;
const LOGON_PAGE = `<!doctype html><html><body><form action="/Logon"><input name="Email" type="text"><input name="Password" type="password"></form></body></html>`;
const filterPage = (token) =>
  `<!doctype html><html><body>${CHROME}<form method="post" action="/myaccount/orderhistory">${
    token === null ? "" : `<input name="__RequestVerificationToken" type="hidden" value="${token}">`
  }<select name="DateRange"><option>Last 120 Days</option></select></form></body></html>`;
/* The real end page after the last order page: the filter form with no order rows. Built from
   filterPage, so the form has one home. */
const EMPTY_PAGE = filterPage(TOKEN);

const reply = (url, html, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  url,
  headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
  text: async () => html,
});
const pageOf = (url) => {
  const n = new URL(url).searchParams.get("PageNumber");
  return n === null ? null : Number(n);
};

/* Records each request in order. `respond` answers it. */
function recordingFetch(respond) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    const u = String(url);
    const req = {
      method: String(init.method || "GET").toUpperCase(),
      url: u,
      page: pageOf(u),
      body: init.body == null ? "" : String(init.body),
      signal: init.signal,
    };
    calls.push(req);
    return respond(req);
  };
  return { fetch, calls };
}

/* The order-history site. `pages` holds the bodies of PageNumber 1 to n; every later page is
   empty. `token` null leaves the form token out. `override(req)` may return a reply or a
   promise, or throw, to change one request; undefined means the default answer. */
function site({ pages = [], token = TOKEN, override = () => undefined } = {}) {
  return async (req) => {
    const special = override(req);
    if (special !== undefined) return special;
    if (req.method === "POST" || req.page === null) return reply(ORDER_URL, filterPage(token));
    return reply(req.url, req.page <= pages.length ? pages[req.page - 1] : EMPTY_PAGE);
  };
}

const readAll = (fetch, timeoutMs = 30000) => call("readAllPages", { fetch, base: BASE, parseDom, timeoutMs });
const trim = (html) => call("trimPage", html, parseDom);
const build = (body) => call("buildOrdersRequest", WORKER, KEY, body);
const badge = (result) => call("badgeFor", result);

/* ---------- 0. controls: green on the old code, they never call the core ---------- */
await test("0.1 control:", async () => {
  const token = parseDom(filterPage(TOKEN)).querySelector('input[name="__RequestVerificationToken"]')?.value;
  const rowCount = parseDom(orderPage(1, 3)).querySelectorAll("div.orderWrap").length;
  eq({ token, rowCount }, { token: TOKEN, rowCount: 3 }, "the fixture pages parse with the token input and 3 order rows");
});

await test("0.2 control:", async () => {
  const s = site({ pages: [orderPage(1, 1)] });
  const p1 = await s({ method: "GET", url: `${ORDER_URL}?PageNumber=1`, page: 1 });
  const p2 = await s({ method: "GET", url: `${ORDER_URL}?PageNumber=2`, page: 2 });
  eq({ p1: await p1.text(), p2: await p2.text() }, { p1: orderPage(1, 1), p2: EMPTY_PAGE },
    "the fake site serves the declared page 1, then an empty page 2");
});

/* ---------- 1. the 12 h gate ---------- */
// The gate is "more than 12 h old": the boundary itself does not pull. Times are epoch ms.
await test("1.1", async () =>
  eq(await call("shouldPull", null, NOW), true, "no earlier success (null) must pull"));

await test("1.2", async () =>
  eq(await call("shouldPull", NOW - (12 * HOUR - 1), NOW), false,
    "a success 12 h less 1 ms old must not pull"));

await test("1.3", async () =>
  eq(await call("shouldPull", NOW - 12 * HOUR, NOW), false,
    "a success exactly 12 h old must not pull, since the gate is more than 12 h"));

await test("1.4", async () =>
  eq(await call("shouldPull", NOW - (12 * HOUR + 1), NOW), true,
    "a success 12 h and 1 ms old must pull"));

await test("1.5", async () =>
  eq(await call("shouldPull", NOW, NOW), false, "a success at this moment must not pull"));

/* ---------- 2. the page loop: readAllPages ---------- */
await test("2.1", async () => {
  const { fetch, calls } = recordingFetch(site({ pages: [orderPage(1, 2), orderPage(2, 3), orderPage(3, 1)] }));
  const res = await readAll(fetch);
  eq(calls.map((c) => `${c.method} ${c.url}`), [
    `GET ${ORDER_URL}`,
    `POST ${ORDER_URL}`,
    `GET ${ORDER_URL}?PageNumber=1`,
    `GET ${ORDER_URL}?PageNumber=2`,
    `GET ${ORDER_URL}?PageNumber=3`,
    `GET ${ORDER_URL}?PageNumber=4`,
  ], "scope, requests run the order-history GET, the filter POST, then pages 1 to 4 in order");
  eq(res, { pages: [rows(1, 2), rows(2, 3), rows(3, 1)] },
    "pages 1 to 3 come back as their trimmed bodies, and the empty page 4 is not among them");
});

await test("2.2", async () => {
  const { fetch, calls } = recordingFetch(site({ pages: [orderPage(1, 1)] }));
  await readAll(fetch);
  eq(calls[1]?.method, "POST", "scope, the second request is the filter POST");
  const form = new URLSearchParams(calls[1]?.body ?? "");
  eq({ keys: [...form.keys()].sort(), token: form.get("__RequestVerificationToken"), dateRange: form.get("DateRange") },
    { keys: ["ClearSessionFilters", "DateRange", "SearchString", "__RequestVerificationToken"], token: TOKEN, dateRange: "Last 120 Days" },
    "the filter POST carries the four form fields, the page's token, and DateRange Last 120 Days");
});

await test("2.3", async () => {
  const { fetch, calls } = recordingFetch(site({ pages: [] }));
  const res = await readAll(fetch);
  eq(calls.some((c) => c.page === 1), true, "scope, the loop reached PageNumber=1");
  eq(res, { failure: "signed-out" }, "page 1 with no order rows reads as signed-out");
});

await test("2.4", async () => {
  const override = (req) => (req.method === "GET" && req.page === null ? reply(`${BASE}/Logon`, LOGON_PAGE) : undefined);
  const { fetch, calls } = recordingFetch(site({ override }));
  const res = await readAll(fetch);
  eq(calls[0]?.url, ORDER_URL, "scope, the first request is the order-history GET");
  eq(res, { failure: "signed-out" }, "an order-history GET that ends on a logon URL reads as signed-out");
});

await test("2.5", async () => {
  const override = (req) => (req.page === 2 ? reply(`${BASE}/Logon`, LOGON_PAGE) : undefined);
  const { fetch, calls } = recordingFetch(site({ pages: [orderPage(1, 2), orderPage(2, 2)], override }));
  const res = await readAll(fetch);
  eq(calls.some((c) => c.page === 2), true, "scope, the loop reached PageNumber=2");
  eq(res, { failure: "signed-out" },
    "a later page that ends off the order-history path reads as signed-out, not as the end of the read");
});

await test("2.6", async () => {
  const override = (req) => (req.method === "GET" && req.page === null ? reply(ORDER_URL, "", 500) : undefined);
  const { fetch, calls } = recordingFetch(site({ override }));
  const res = await readAll(fetch);
  eq(calls[0]?.url, ORDER_URL, "scope, the first request is the order-history GET");
  eq(res, { failure: "fetch" }, "a non-2xx order-history GET reads as fetch");
});

await test("2.7", async () => {
  const override = (req) => (req.page === 2 ? reply(req.url, "server error", 500) : undefined);
  const { fetch, calls } = recordingFetch(site({ pages: [orderPage(1, 1), orderPage(2, 1)], override }));
  const res = await readAll(fetch);
  eq(calls.some((c) => c.page === 2), true, "scope, the loop reached PageNumber=2");
  eq(res, { failure: "fetch" }, "a non-2xx page GET reads as fetch");
});

await test("2.8", async () => {
  const override = (req) => (req.method === "POST" ? reply(ORDER_URL, "unavailable", 503) : undefined);
  const { fetch, calls } = recordingFetch(site({ override }));
  const res = await readAll(fetch);
  eq(calls.some((c) => c.method === "POST"), true, "scope, the filter POST was sent");
  eq(res, { failure: "fetch" }, "a non-2xx filter POST reads as fetch");
});

await test("2.9", async () => {
  const override = (req) => {
    if (req.page === 1) throw new TypeError("Failed to fetch");
    return undefined;
  };
  const { fetch, calls } = recordingFetch(site({ pages: [orderPage(1, 1)], override }));
  const res = await readAll(fetch);
  eq(calls.some((c) => c.page === 1), true, "scope, the loop reached PageNumber=1");
  eq(res, { failure: "fetch" }, "a network error thrown by fetch reads as fetch");
});

await test("2.10", async () => {
  const { fetch, calls } = recordingFetch(site({ token: null, pages: [orderPage(1, 1)] }));
  const res = await readAll(fetch);
  eq(calls[0]?.url, ORDER_URL, "scope, the first request is the order-history GET");
  eq(res, { failure: "fetch" }, "an order-history page without the form token reads as fetch");
});

// The fetch for page 2 never settles, so only the deadline can end it. The outcome does not
// depend on how fast the machine runs.
await test("2.11", async () => {
  const hang = (req) =>
    req.page === 2
      ? new Promise((_, reject) => req.signal?.addEventListener("abort", () => reject(new Error("aborted"))))
      : undefined;
  const { fetch, calls } = recordingFetch(site({ pages: [orderPage(1, 1), orderPage(2, 1)], override: hang }));
  const res = await readAll(fetch, 1);
  eq(calls.some((c) => c.page === 2), true, "scope, the loop reached PageNumber=2");
  eq(res, { failure: "timeout" }, "a page fetch that outlasts timeoutMs reads as timeout");
});

await test("2.12", async () => {
  const N = 70;
  const { fetch, calls } = recordingFetch(site({ pages: Array.from({ length: N }, (_, i) => orderPage(i + 1, 2)) }));
  const res = await readAll(fetch);
  eq(calls.filter((c) => c.page !== null).map((c) => c.page), Array.from({ length: N + 1 }, (_, i) => i + 1),
    "scope, page requests run 1 to 71, and the empty page 71 ends the read");
  eq(res, { pages: Array.from({ length: N }, (_, i) => rows(i + 1, 2)) },
    "all 70 pages come back, with no page cap");
});

/* ---------- 3. the trim: trimPage ---------- */
await test("3.1", async () => {
  const html = `<!doctype html><html><body>${CHROME}<form><input name="__RequestVerificationToken" value="${TOKEN}"></form>${rows(1, 2)}<div class="note">Synthetic note</div>${rows(2, 1)}</body></html>`;
  eq(await trim(html), rows(1, 2) + rows(2, 1),
    "the order rows come back in page order, with the nav, the form and the note dropped");
});

await test("3.2", async () =>
  eq(await trim(EMPTY_PAGE), "", "a page with no order rows trims to the empty string"));

await test("3.3", async () => {
  const html = `<body><section class="orderWrap">Synthetic section</section><div class="orderWrapper">Synthetic wrapper</div><div class="card orderWrap" data-order="SYN-9">Synthetic card row</div></body>`;
  eq(await trim(html), `<div class="card orderWrap" data-order="SYN-9">Synthetic card row</div>`,
    "only a div with the orderWrap class token matches, so a section or an orderWrapper div is left out");
});

await test("3.4", async () =>
  eq(await trim(orderPage(1, 25)), rows(1, 25), "a full page of 25 rows keeps all 25, in order"));

/* ---------- 4. the request to the Worker: buildOrdersRequest ---------- */
await test("4.1", async () => {
  const req = await build({ v: 1, pages: [rows(1, 2), rows(2, 1)] });
  eq({ url: req?.url, method: req?.init?.method }, { url: `${WORKER}/orders`, method: "POST" },
    "a POST to the Worker's /orders route");
});

await test("4.2", async () => {
  const req = await build({ v: 1, pages: [rows(1, 2)] });
  const h = new Headers(req?.init?.headers);
  eq(h.get("authorization"), `Bearer ${KEY}`, "the device key travels as Authorization: Bearer");
});

await test("4.3", async () => {
  const req = await build({ v: 1, pages: [rows(1, 2)] });
  eq(typeof req?.url, "string", "scope, buildOrdersRequest returned a request");
  const h = new Headers(req?.init?.headers);
  const otherHeaders = [...h].filter(([name]) => name !== "authorization").map(([, v]) => v);
  eq({
    inUrl: req.url.includes(KEY),
    inBody: String(req?.init?.body ?? "").includes(KEY),
    inOtherHeaders: otherHeaders.some((v) => v.includes(KEY)),
  }, { inUrl: false, inBody: false, inOtherHeaders: false },
    "the device key appears in the Authorization header and nowhere else");
});

await test("4.4", async () => {
  const req = await build({ v: 1, pages: [rows(1, 2), rows(2, 1)] });
  eq(jsonBody(req?.init?.body), { v: 1, pages: [rows(1, 2), rows(2, 1)] },
    "the body is JSON {v:1, pages}");
});

await test("4.5", async () => {
  const req = await build({ v: 1, failure: "timeout" });
  eq(jsonBody(req?.init?.body), { v: 1, failure: "timeout" }, "a failure body is JSON {v:1, failure}");
});

/* ---------- 5. the badge: badgeFor ---------- */
// The result is either a read failure {failure} or the Worker's reply {status, body}.
await test("5.1", async () => {
  const b = await badge({ status: 200, body: { added: 3 } });
  eq({ text: b?.text, kind: typeof b?.kind === "string" && b.kind !== "" }, { text: "3", kind: true },
    "a success that added 3 shows 3, with a kind");
});

await test("5.2", async () => {
  const b = await badge({ status: 200, body: { added: 0 } });
  eq({ text: b?.text, kind: typeof b?.kind === "string" && b.kind !== "" }, { text: "", kind: true },
    "a success that added 0 shows an empty badge, with a kind");
});

await test("5.3", async () =>
  eq((await badge({ failure: "signed-out" }))?.text, "in", "a signed-out read shows in"));

await test("5.4", async () =>
  eq((await badge({ failure: "fetch" }))?.text, "!", "a fetch failure shows !"));

await test("5.5", async () =>
  eq((await badge({ failure: "timeout" }))?.text, "!", "a timeout shows !"));

await test("5.6", async () =>
  eq((await badge({ status: 500, body: { error: "server" } }))?.text, "!", "a Worker reply that is not 200 shows !"));

await test("5.7", async () => {
  const signedOut = await badge({ failure: "signed-out" });
  const failed = await badge({ failure: "fetch" });
  eq(typeof signedOut?.kind === "string" && signedOut.kind !== failed?.kind, true,
    "the signed-out badge has a kind of its own, not the failure kind");
});

/* ---------- report ---------- */
if (loadNote) console.log(`note: extension/core.mjs did not load (${loadNote}); each case reads undefined from it`);
const total = passed + fails.length;
console.log(`\n${passed} passed, ${fails.length} failed`);
if (fails.length) {
  for (const f of fails) console.log(`  ✗ ${f}`);
  console.log(failLine(fails.length, total));
  process.exit(1);
}
console.log("all green");
