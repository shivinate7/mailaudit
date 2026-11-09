/* Contract tests for the UI helpers in extension/core.mjs: the toolbar badge and its icon title,
   the status request, and the options page's last-run, failure and Next lines. Run with
   `npm run test:extension`. Plain node, no framework, the same ok/eq shape as
   test/extension-core.test.mjs.

   Each expected value is pinned to the mockup notes (docs/design/orders-extension/badge-notes.md
   and options-notes.md, by item) or to a departure the builder named in PR 243. A case that
   disagrees with the notes stays in the file, red, and is listed as a defect.

   The zone is pinned to New York below, so every local time here reads the same on any runner. */
process.env.TZ = "America/New_York";

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

/* ---------- harness: the ok/eq/report shape of test/extension-core.test.mjs ---------- */
let passed = 0;
const fails = [];
class Assertion extends Error {}

const canon = (v) => {
  if (v === undefined) return "undefined";
  return JSON.stringify(v, (_, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))
      : x
  );
};
const show = (s) => (s.length > 200 ? `${s.slice(0, 200)}...` : s);

/* The first failed assert ends its case, so each case reports one cause. */
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

/* ---------- fixtures: synthetic only ---------- */
const WORKER = "https://orders.example.test";
const KEY = "synthetic-device-key-7e2a";
const HOUR = 60 * 60 * 1000;
/* Sun, Nov 8 2026 in New York: the pull at 9:14 AM, its 12 h gate at 9:14 PM, and a later
   reading the same morning. The mockup's own example is this pull. */
const PULL_AT = Date.UTC(2026, 10, 8, 14, 14);
const NEXT_AT = PULL_AT + 12 * HOUR;
const LATER = PULL_AT + HOUR;
const iso = (ms) => new Date(ms).toISOString();
/* ICU has written a narrow no-break space before AM and PM in some versions. The notes write a
   plain space, so whitespace is folded before a comparison. Only the spacing changes. */
const fold = (s) => (typeof s === "string" ? s.replace(/\s/g, " ") : s);
const when = (ms) => fold(call("whenText", ms));
const shown = (d) => ({ text: d?.text, kind: d?.kind, title: fold(d?.title) });
const LEAD = "MANIFEST orders: ";
const okRun = (added, at = PULL_AT, extra = {}) => ({ at, ok: true, added, ...extra });
const failRun = (kind, at = PULL_AT) => ({ at, ok: false, kind });

/* ---------- 0. controls: green on the old code, they never call the helpers under test ---------- */
await test("0.1 control:", async () =>
  eq({
    hour: new Date(PULL_AT).getHours(),
    nextHour: new Date(NEXT_AT).getHours(),
    locale: Intl.DateTimeFormat().resolvedOptions().locale.split("-")[0],
  }, { hour: 9, nextHour: 21, locale: "en" },
    "the pinned zone reads the pull at 9 and its gate at 21, and the runner's locale is English, so the local times below hold"));

/* ---------- 1. the status request: buildStatusRequest ---------- */
const status = (origin = WORKER, key = KEY) => call("buildStatusRequest", origin, key);

await test("1.1", async () => {
  const req = status();
  eq({ url: req?.url, method: req?.init?.method }, { url: `${WORKER}/orders/status`, method: "GET" },
    "the status check is a GET of /orders/status (options-notes item 5)");
});

await test("1.2", async () => {
  const h = new Headers(status()?.init?.headers);
  eq(h.get("authorization"), `Bearer ${KEY}`, "the device key travels as Authorization: Bearer, as the pulls send it");
});

await test("1.3", async () => {
  const req = status();
  eq(typeof req?.url, "string", "scope, buildStatusRequest returned a request");
  const others = [...new Headers(req.init?.headers)].filter(([name]) => name !== "authorization").map(([, v]) => v);
  eq({ inUrl: req.url.includes(KEY), inOtherHeaders: others.some((v) => v.includes(KEY)) },
    { inUrl: false, inOtherHeaders: false },
    "the device key appears in the Authorization header and nowhere else");
});

await test("1.4", async () =>
  eq(status(`${WORKER}///`)?.url, `${WORKER}/orders/status`,
    "a trailing slash on the Worker origin is dropped, as buildOrdersRequest drops it"));

await test("1.5", async () => {
  const req = status();
  eq(typeof req?.url, "string", "scope, buildStatusRequest returned a request");
  eq(req.init?.body, undefined, "a status request carries no body");
});

/* ---------- 2. the toolbar: displayFor, badge-colors fills and the icon title ---------- */
const disp = (state) => call("displayFor", state);

await test("2.1", async () =>
  eq(shown(disp({ hasKey: true, pulling: false, run: okRun(12) })),
    { text: "12", kind: "success", title: `${LEAD}12 new lines. Pulled Sun, Nov 8, 9:14 AM.` },
    "a pull that added 12 lines shows 12 on the count fill, and its title gives the count and the owner's local time (badge-notes items 2, 4)"));

await test("2.2", async () =>
  eq(shown(disp({ hasKey: true, pulling: false, run: okRun(1) })).title,
    `${LEAD}1 new line. Pulled Sun, Nov 8, 9:14 AM.`,
    "a pull that added 1 line says line, not lines (the notes show only the plural, so this is the plain singular)"));

await test("2.3", async () => {
  const d = shown(disp({ hasKey: true, pulling: false, run: okRun(0) }));
  eq({ text: d.text, title: d.title }, { text: "", title: `${LEAD}no new lines. Pulled Sun, Nov 8, 9:14 AM.` },
    "a pull that added 0 lines shows no badge, and its title says no new lines (badge-notes items 1, 4)");
});

await test("2.4", async () =>
  eq({
    at999: disp({ hasKey: true, pulling: false, run: okRun(999) })?.text,
    at1000: disp({ hasKey: true, pulling: false, run: okRun(1000) })?.text,
  }, { at999: "999", at1000: "999+" },
    "a count of 999 shows as it is, and 1000 is the first count that reads 999+ (badge-notes item 5)"));

await test("2.5", async () =>
  eq(disp({ hasKey: true, pulling: false, run: okRun(1234) })?.text, "999+",
    "a count of 1234 reads 999+ on the badge (badge-notes item 5)"));

await test("2.6", async () =>
  eq(shown(disp({ hasKey: true, pulling: true, run: okRun(12) })),
    { text: "…", kind: "pulling", title: `${LEAD}pulling your orders.` },
    "a pull under way shows … on the accent fill, and its title names no page number (badge-notes item 8; PR 243 departure)"));

await test("2.7", async () =>
  eq(shown(disp({ hasKey: false, pulling: false, run: okRun(12) })),
    { text: "", kind: "none", title: `${LEAD}no device key. Open Options to paste one.` },
    "no device key shows no badge, with its own title (badge-notes items 1, 4)"));

await test("2.8", async () =>
  eq(shown(disp({ hasKey: true, pulling: false, run: null })),
    { text: "", kind: "none", title: `${LEAD}no pull yet. It runs when a store page loads.` },
    "a key and no pull yet show no badge, and the title says no pull yet, not no new lines (PR 243 departure, no pull yet icon title)"));

await test("2.9", async () =>
  eq(shown(disp({ hasKey: true, pulling: false, run: failRun("signed-out") })),
    { text: "in", kind: "signed-out", title: `${LEAD}signed out of TCGplayer. Sign in, then load any store page.` },
    "a signed-out pull shows in on the amber fill, with the sign-in title (badge-notes items 1, 2, 4)"));

await test("2.10", async () =>
  eq(shown(disp({ hasKey: true, pulling: false, run: failRun("fetch") })),
    { text: "!", kind: "failure", title: `${LEAD}the last pull failed. Open Options for the fix.` },
    "a failed pull shows ! on the red fill, with the Options title (badge-notes items 1, 2, 4)"));

await test("2.11", async () =>
  eq(shown(disp({ hasKey: true, pulling: false, run: failRun("server") })),
    { text: "!", kind: "failure", title: `${LEAD}the last pull failed. Open Options for the fix.` },
    "a server failure shows ! on the red fill, as any other failure does (PR 243 departure, server failure kind)"));

await test("2.12", async () => {
  const d = disp({ hasKey: true, pulling: false, run: okRun(2, PULL_AT, { unreadable: 1 }) });
  eq({ text: d?.text, kind: d?.kind }, { text: "2", kind: "success" },
    "a success that dropped one unreadable line shows its count, not ! (badge-notes item 1)");
});

await test("2.13", async () => {
  const states = [
    { hasKey: false, pulling: false, run: null },
    { hasKey: true, pulling: true, run: null },
    { hasKey: true, pulling: false, run: null },
    { hasKey: true, pulling: false, run: okRun(12) },
    { hasKey: true, pulling: false, run: okRun(0) },
    { hasKey: true, pulling: false, run: failRun("signed-out") },
    { hasKey: true, pulling: false, run: failRun("fetch") },
  ];
  const titled = states.map((s) => {
    const t = fold(disp(s)?.title);
    return typeof t === "string" && t.startsWith(LEAD);
  });
  eq(titled, states.map(() => true), "every state sets an icon title that starts with the lead (badge-notes item 4)");
});

/* ---------- 3. the pull's outcome: outcomeOf ---------- */
const outcome = (read, post) => call("outcomeOf", read, post);
const READ_OK = { pages: [] };
const READ_FAILED = (kind) => ({ failure: kind });

await test("3.1", async () =>
  eq(outcome(READ_OK, { status: 200, body: { v: 1, orders: 41, items: 58, added: 12, unreadable: 0 } }),
    { ok: true, orders: 41, items: 58, added: 12, unreadable: 0 },
    "a 200 reply reads as a success with its counts (options-notes item 11: '41 orders read, 12 new lines')"));

await test("3.2", async () =>
  eq(outcome(READ_OK, { status: 200, body: { orders: 41, items: 58, added: 12, unreadable: 2 } }),
    { ok: true, orders: 41, items: 58, added: 12, unreadable: 2 },
    "a success that dropped 2 unreadable lines is still ok, with the count kept (badge-notes item 1; options-notes item 12)"));

await test("3.3", async () =>
  eq(outcome(READ_OK, { status: 401, body: { error: "unauthorized" } }), { ok: false, kind: "unauthorized" },
    "a 401 is unauthorized: the server refused the device key (options-notes table)"));

await test("3.4", async () =>
  eq(outcome(READ_OK, { status: 413, body: { error: "too-large" } }), { ok: false, kind: "too-large" },
    "a 413 is too-large (options-notes table, too-large row)"));

/* The Worker refuses a body it cannot read with 400 bad body (worker/core.mjs, postOrders), and the
   notes name the bad body kind on its own line. */
await test("3.5", async () =>
  eq(outcome(READ_OK, { status: 400, body: { error: "bad body" } }), { ok: false, kind: "bad body" },
    "a 400 is bad body, the kind for a body the Worker cannot read (options-notes table, bad body row)"));

await test("3.6", async () =>
  eq({
    empty: outcome(READ_OK, { status: 422, body: { error: "empty" } }),
    noItems: outcome(READ_OK, { status: 422, body: { error: "no-items" } }),
  }, { empty: { ok: false, kind: "empty" }, noItems: { ok: false, kind: "no-items" } },
    "a 422 names its kind by its error: empty, or no-items (options-notes table)"));

await test("3.7", async () =>
  eq(outcome(READ_OK, { status: 500, body: { error: "status-write-failed" } }), { ok: false, kind: "server" },
    "a 500 is the server kind, which the options page words as the ledger server's error (PR 243 departure)"));

await test("3.8", async () =>
  eq(outcome(READ_OK, { network: true }), { ok: false, kind: "network" },
    "no reply at all is the network kind (options-notes table)"));

await test("3.9", async () =>
  eq(outcome(READ_FAILED("fetch"), { status: 200, body: { recorded: "fetch" } }), { ok: false, kind: "fetch" },
    "a 200 that records the posted failure is a failure of the read's kind, not a success (worker test 72.14)"));

/* ---------- 4. the failure a pull leaves: failureOf ---------- */
const failure = (o, now) => call("failureOf", o, now);

await test("4.1", async () =>
  eq(failure({ ok: false, kind: "server" }, PULL_AT), { kind: "server", at: PULL_AT },
    "a failed pull leaves its kind and its time (PR 243 departure, server failure kind)"));

await test("4.2", async () =>
  eq(failure({ ok: true, orders: 41, items: 58, added: 12, unreadable: 0 }, PULL_AT), null,
    "a clean success leaves no failure (options-notes item 12: None)"));

await test("4.3", async () =>
  eq(failure({ ok: true, orders: 41, items: 58, added: 12, unreadable: 3 }, PULL_AT),
    { kind: "unreadable", at: PULL_AT, count: 3 },
    "a success that dropped 3 lines leaves an unreadable failure with the count (options-notes item 12)"));

/* ---------- 5. the options page's run: mergeStatus, this browser's record against the Worker's ---------- */
const merge = (local, server) => call("mergeStatus", local, server);
const NOTHING = { run: null, failure: null };

await test("5.1", async () =>
  eq(merge(NOTHING, { lastSuccessAt: iso(PULL_AT), lastFailure: null }),
    { run: { at: PULL_AT, ok: true }, failure: null },
    "with no local pull, the Worker's last success stands in for the run (options-notes item 13)"));

await test("5.2", async () => {
  const local = { run: okRun(0, LATER), failure: null };
  eq(merge(local, { lastSuccessAt: iso(PULL_AT), lastFailure: null }), local,
    "a local run at or after the Worker's latest event is kept as it is (options-notes item 13)");
});

await test("5.3", async () =>
  eq(merge({ run: okRun(3), failure: null },
    { lastSuccessAt: iso(PULL_AT), lastFailure: { kind: "fetch", at: iso(LATER) } }),
    { run: { at: LATER, ok: false, kind: "fetch" }, failure: { kind: "fetch", at: LATER } },
    "a Worker failure later than this browser's run shows its kind and time, from another browser's pull (options-notes item 13)"));

await test("5.4", async () =>
  eq(merge({ run: failRun("fetch"), failure: { kind: "fetch", at: PULL_AT } },
    { lastSuccessAt: iso(LATER), lastFailure: null }),
    { run: { at: LATER, ok: true }, failure: null },
    "a Worker success later than this browser's failure clears it, as the Worker clears a failure on a good run (worker test 72.23)"));

await test("5.5", async () =>
  eq(merge(NOTHING, { lastSuccessAt: null, lastFailure: null }), NOTHING,
    "with nothing on either side, the page shows no run and no failure"));

/* The Worker writes a success that dropped lines with one time for both the success and its
   unreadable record, so the record is not newer than the success. The run still reads Pulled
   (options-notes item 12). */
await test("5.6", async () =>
  eq(merge(NOTHING, { lastSuccessAt: iso(PULL_AT), lastFailure: { kind: "unreadable", at: iso(PULL_AT), count: 2 } }),
    { run: { at: PULL_AT, ok: true }, failure: { kind: "unreadable", at: PULL_AT, count: 2 } },
    "a Worker success that dropped 2 lines reads as Pulled, with the unreadable record kept (options-notes item 12)"));

/* ---------- 6. the owner's local time: whenText ---------- */
await test("6.1", async () =>
  eq(when(PULL_AT), "Sun, Nov 8, 9:14 AM",
    "the owner's local time reads as the notes write it (badge-notes item 4)"));

await test("6.2", async () =>
  eq(when(PULL_AT + 24 * HOUR), "Mon, Nov 9, 9:14 AM",
    "a time on another day carries its weekday and day (options-notes item 11)"));

await test("6.3", async () =>
  eq(when(NEXT_AT), "Sun, Nov 8, 9:14 PM", "an evening time reads PM on its day"));

/* ---------- 7. the clock alone: timeText ---------- */
await test("7.1", async () =>
  eq(fold(call("timeText", PULL_AT)), "9:14 AM", "the time alone reads 9:14 AM"));

await test("7.2", async () =>
  eq(fold(call("timeText", NEXT_AT)), "9:14 PM",
    "the time of the gate reads 9:14 PM, the notes' 'after 9:14 PM' (options-notes item 11)"));

/* ---------- 8. the next moment: nextPullAt ---------- */
const nextAt = (last, now) => call("nextPullAt", last, now);

await test("8.1", async () =>
  eq(nextAt(null, LATER), null,
    "no pull yet gives no next moment: the first pull runs when a store page loads (options-notes item 11, Never)"));

await test("8.2", async () =>
  eq(nextAt(PULL_AT, LATER), NEXT_AT,
    "the next moment is 12 h after the pull, 9:14 PM (options-notes item 11)"));

await test("8.3", async () =>
  eq(nextAt(PULL_AT, PULL_AT + 13 * HOUR), null,
    "a pull already past the gate gives no next moment: the next store page load pulls"));

/* At exactly 12 h the gate does not open (case 1.3), so a store page load does not pull yet and
   the next moment is still 9:14 PM. The scope comes first. */
await test("8.4", async () => {
  eq(call("shouldPull", PULL_AT, NEXT_AT), false, "scope, at exactly 12 h a store page load does not pull (case 1.3)");
  eq(nextAt(PULL_AT, NEXT_AT), NEXT_AT,
    "at exactly 12 h the next moment is still 9:14 PM, not no moment (options-notes item 11; the gate is more than 12 h)");
});

await test("8.5", async () =>
  eq(when(nextAt(PULL_AT, LATER)), "Sun, Nov 8, 9:14 PM",
    "the next moment, written with its day, is Sun, Nov 8, 9:14 PM (PR 243 departure, Next carries its day)"));

/* ---------- 9. the count on the badge: capBadgeText ---------- */
const cap = (text) => call("capBadgeText", text);

await test("9.1", async () =>
  eq({ n999: cap("999"), n1000: cap("1000"), n12345: cap("12345") },
    { n999: "999", n1000: "999+", n12345: "999+" },
    "a count of 999 or less shows as it is, and any count over 999 reads 999+ (badge-notes item 5)"));

await test("9.2", async () =>
  eq(["…", "!", "in", ""].map(cap), ["…", "!", "in", ""],
    "a badge text that is not a count passes through unchanged"));

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
