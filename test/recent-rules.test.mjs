/* Contract tests for src/recent-rules.mjs, the pure half of the web Recent log.
   Decision recent-checks-can-be-undone ("Proof the build must give", "What it touches")
   and plan recent-log-web ("The module"). Run: npm run test:recent-rules. Exits 1 on any failure.

   The module is not built yet. It loads through a dynamic import that catches the miss,
   and every call goes through api(), which returns undefined for a missing export. So
   each case fails on its own assert, with the cause named in its label, never on a crash
   or an import error.

   Return shapes the plan does not pin, which this file therefore pins:
     groupByDay(rows, now) gives [{ label, rows }], newest group first, rows newest first.
   The rest follow the plan: addEntry gives { log, lastId }; undoEntry gives { ledger, undo }
   or { refused }; the others give a value directly.

   Ids are R<group>.<case>:
     R1  addEntry: the merge, the drop, and when a merge stops
     R2  capLog: 14 days, 200 rows, undo entries, order
     R3  mergeRecent: union, later time, tie, symmetric, idempotent, cap
     R4  rowState for counts: two steps on one card, the receivedAt guard, a restore
     R5  count undo: clamp at zero and at the quantity, key absent, a hand edit survives
     R6  stamps, envelopes, assigns and bulk: the undo, and the refusal
     R7  isLive
     R8  rowLabel
     R9  groupByDay on the local day, not the UTC day (CI runs outside UTC, ci-runs-in-utc)
     R10 newEntryId

   Every time is a fixed constant, so no assert reads the clock. Test temp files: none. */

// Pinned here, before any Date is made, so the day labels are checked in a zone that is not UTC.
process.env.TZ = "America/New_York";

import { canon, restampRestore } from "../src/merge-rules.mjs";
import { failLine } from "./fail-line.mjs";

let R = {};
let loadNote = "loaded";
try {
  R = await import("../src/recent-rules.mjs");
} catch (e) {
  loadNote = `not loaded: ${e.message.split("\n")[0]}`;
}
const api = (name) => (typeof R[name] === "function" ? R[name] : () => undefined);

let pass = 0;
const fails = [];
const ok = (cond, label, detail = "") => {
  if (cond) pass++;
  else fails.push(`${label}${detail ? `\n     ${detail}` : ""}`);
};
// Deep equal, key order free. An undefined actual always fails: a missing export returns undefined,
// and two missing results must not pass as equal to each other.
const eq = (actual, expected, label) => {
  const a = canon(actual);
  const e = canon(expected);
  if (actual !== undefined && a === e) pass++;
  else fails.push(`${label}\n     expected ${e}\n     actual   ${a}`);
};

/* ---------- fixtures ---------- */

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const NOW = Date.UTC(2026, 9, 5, 15, 0); // Mon 5 Oct 2026, 15:00Z, 11:00 in New York
const T = (n) => NOW - (120 - n) * MIN; // T(0) is 2 h before NOW, T(120) is NOW; a larger n is later
const K = "A1|0|pLightningBolt";
const K2 = "A1|0|pCounterspell";
const GK = "A1|Alpha Cards";
const ITEMS = [
  { key: K, qty: 4 },
  { key: K2, qty: 4 },
];
const ledger = (o = {}) => ({ items: ITEMS, received: {}, receivedAt: {}, stamps: {}, envelopes: [], ...o });

const count = (id, at, key, before, after) => ({ id, at, kind: "count", key, before, after });
const bulk = (id, at, gk, counts) => ({ id, at, kind: "bulk", gk, counts });
const stamp = (id, at, gk, before, after, updatedAt) => ({ id, at, kind: "stamp", gk, before, after, updatedAt });
const env = (id, at, op, before, after, updatedAt) => ({ id, at, kind: "envelope", op, before, after, updatedAt });
const assign = (id, at, plan, before, after, updatedAt) => ({ id, at, kind: "assign", plan, before, after, updatedAt });
const undoOf = (id, at, of) => ({ id, at, kind: "undo", of });
const S = (kind, updatedAt, at = "2026-10-01") => ({ kind, at, note: "", updatedAt });
const TOMB = (updatedAt) => ({ kind: "", at: "", note: "", updatedAt });
const E = (id, updatedAt, entries = [{ name: "Lightning Bolt", qty: 1 }]) => ({
  id,
  entries,
  photos: [],
  note: "",
  updatedAt,
});
// Count row n: one card, one check, n minutes into a five-hour window that ends at NOW.
const row = (i) => count(`r${i}`, NOW - (300 - i) * MIN, `k${i}`, 0, 1);
const rows = (n) => Array.from({ length: n }, (_, i) => row(i));
const ids = (arr) => arr?.map((e) => e?.id);

const add = (log, entry, lastId) => api("addEntry")(log, entry, lastId);
const cap = (log, now = NOW) => api("capLog")(log, now);
const mergeR = (a, b, now = NOW) => api("mergeRecent")(a, b, now);
const state = (entry, log, l) => api("rowState")(entry, log, l);
const undo = (entry, l, now = NOW) => api("undoEntry")(entry, l, now);
const live = (log, l) => api("isLive")(log, l);
const label = (entry) => api("rowLabel")(entry);
const days = (rs, now) => api("groupByDay")(rs, now);
const labels = (g) => g?.map((x) => x?.label);
const rowIds = (g, i) => g?.[i]?.rows?.map((r) => r?.id);

/* ---------- R1 addEntry ---------- */

{
  const out = add([count("r1", T(1), K, 0, 1)], count("r2", T(2), K, 1, 2), "r1");
  eq(out?.log?.length, 1, "R1.1 a second write to one card merges into the first entry");
  eq(out?.log?.[0]?.id, "r1", "R1.1a the merged entry keeps the first id");
  eq(out?.log?.[0]?.before, 0, "R1.1b the merged entry keeps the first before");
  eq(out?.log?.[0]?.after, 2, "R1.1c and takes the last after");
  eq(out?.log?.[0]?.at, T(2), "R1.1d and takes the last time");
  eq(out?.lastId, "r1", "R1.1e lastId names the merged entry");
}
{
  // another action came between: lastId names a stamp, so the new count is its own row
  const log = [count("r1", T(1), K, 0, 1), stamp("rs", T(2), GK, null, S("claim", T(2)), T(2))];
  const out = add(log, count("r2", T(3), K, 1, 2), "rs");
  eq(out?.log?.length, 3, "R1.2 a write after another action is not merged into the earlier count");
}
{
  // an undo names the entry, so a later write on the same card is its own row
  const log = [count("r1", T(1), K, 0, 1), undoOf("u1", T(2), "r1")];
  const out = add(log, count("r2", T(3), K, 1, 2), "r1");
  eq(out?.log?.length, 3, "R1.3 a write after an undo of its entry is not merged into that entry");
  eq(out?.log?.find((e) => e?.id === "r1")?.after, 1, "R1.3a and the undone entry keeps its own after");
}
{
  const out = add([count("r1", T(1), K, 0, 1)], count("r2", T(2), K2, 0, 1), "r1");
  eq(out?.log?.length, 2, "R1.4 a count on another card is not merged");
}
{
  const first = stamp("s1", T(1), GK, null, S("claim", T(1)), T(1));
  const out = add([first], stamp("s2", T(2), GK, S("claim", T(1)), S("refunded", T(2)), T(2)), "s1");
  eq(out?.log?.length, 2, "R1.5 a stamp never merges into an earlier stamp");
}
{
  // 0 -> 1 then 1 -> 0 on one card leaves no net change, so the merged entry is dropped
  const out = add([count("r1", T(1), K, 0, 1)], count("r2", T(2), K, 1, 0), "r1");
  eq(out?.log, [], "R1.6 a merged entry with no net change is dropped");
}
{
  const out = add([], count("r1", T(1), K, 0, 1), null);
  eq(ids(out?.log), ["r1"], "R1.7 a first write on an empty log is appended");
  eq(out?.lastId, "r1", "R1.7a and becomes lastId");
}

/* ---------- R2 capLog ---------- */

eq(cap([]), [], "R2.1 an empty log stays empty");
{
  const log = [
    count("old", NOW - 14 * DAY - 1, K, 0, 1), // 14 days and 1 ms before now: dropped
    count("edge", NOW - 14 * DAY + 1, K2, 0, 1), // 14 days less 1 ms before now: kept
    count("new", T(120), K, 1, 2),
  ];
  eq(ids(cap(log)), ["edge", "new"], "R2.2 an entry older than 14 days is dropped, and one just inside is kept");
}
{
  const out = cap(rows(201));
  eq(out?.length, 200, "R2.3 with 201 rows, the newest 200 are kept");
  eq(out?.[0]?.id, "r1", "R2.3a and the oldest one is the row that went");
}
eq(cap(rows(200))?.length, 200, "R2.4 a log at exactly 200 rows keeps all of them");
{
  const log = [
    ...rows(200),
    undoOf("u1", NOW - 50 * MIN, "r199"),
    undoOf("u2", NOW - 49 * MIN, "r198"),
    undoOf("u3", NOW - 48 * MIN, "r197"),
  ];
  const out = cap(log);
  eq(out?.length, 203, "R2.5 undo entries do not count toward the 200 rows");
  ok(["u1", "u2", "u3"].every((id) => ids(out)?.includes(id)), "R2.5a and each undo of a kept row is kept");
}
{
  const log = [...rows(201), undoOf("uOld", NOW - 40 * MIN, "r0"), undoOf("uNew", NOW - 30 * MIN, "r200")];
  const out = ids(cap(log));
  eq(out?.includes("uOld"), false, "R2.6 an undo whose row was capped away is dropped with it");
  eq(out?.includes("uNew"), true, "R2.6a and an undo of a kept row is kept");
}
eq(
  ids(cap([count("ancient", NOW - 15 * DAY, K, 0, 1), undoOf("uA", T(60), "ancient")])),
  [],
  "R2.7 an undo whose row fell out by age is dropped too"
);
eq(
  ids(cap([count("b", T(5), K, 0, 1), count("early", T(4), K, 0, 1), count("a", T(5), K2, 0, 1)])),
  ["early", "a", "b"],
  "R2.8 the log is sorted by time, then by id"
);

/* ---------- R3 mergeRecent ---------- */

{
  const out = mergeR([count("a1", T(1), K, 0, 1)], [count("b1", T(2), K2, 0, 1)]);
  eq(ids(out)?.slice().sort(), ["a1", "b1"], "R3.1 two devices that add different rows get both");
}
{
  const older = count("x", T(1), K, 0, 1);
  const newer = count("x", T(2), K, 0, 3);
  eq(mergeR([older], [newer])?.find((e) => e?.id === "x")?.after, 3, "R3.2 on one id the later time wins, from either side");
  eq(mergeR([newer], [older])?.find((e) => e?.id === "x")?.after, 3, "R3.2a in the other direction too");
}
eq(
  mergeR([count("x", T(2), K, 0, 1)], [count("x", T(2), K, 0, 9)])?.find((e) => e?.id === "x")?.after,
  1,
  "R3.3 on one id at one time, the copy from a wins"
);
{
  const a = [count("a1", T(1), K, 0, 1), count("x", T(1), K2, 0, 1)];
  const b = [count("b1", T(3), K2, 0, 1), count("x", T(4), K2, 0, 3)];
  eq(mergeR(b, a), mergeR(a, b), "R3.4 the merge is symmetric");
  const m = mergeR(a, b);
  eq(mergeR(m, b), m, "R3.5 merging a merged list with a side again adds nothing");
  eq(mergeR(m, m), m, "R3.5a and merging a merged list with itself adds nothing");
}
{
  const a = Array.from({ length: 150 }, (_, j) => row(2 * j));
  const b = Array.from({ length: 150 }, (_, j) => row(2 * j + 1));
  const out = mergeR(a, b);
  eq(out?.length, 200, "R3.6 the union is capped at 200 rows");
  eq(ids(out)?.[0], "r100", "R3.6a and keeps the newest 200 of the union");
  eq(mergeR(b, a), out, "R3.6b and the cap gives the same list from either side");
}

/* ---------- R4 rowState for counts ---------- */

{
  // two steps on one card, with another action between them, so they are two rows
  const step1 = count("s1", T(10), K, 0, 1);
  const other = count("kx", T(11), K2, 0, 1);
  const step2 = count("s2", T(12), K, 1, 2);
  const L1 = add([], step1, null)?.log;
  const L2 = add(L1, other, "s1")?.log;
  const L3 = add(L2, step2, "kx")?.log;
  eq(L3?.length, 3, "R4.1pre the two steps on one card are two rows, since another action came between them");
  const l0 = ledger({ received: { [K]: 2, [K2]: 1 }, receivedAt: { [K]: T(12), [K2]: T(11) } });
  const u = undo(step1, l0);
  eq(u?.ledger?.received?.[K], 1, "R4.1 undoing the first step takes its own +1, and the second step's +1 stays");
  eq(u?.undo?.kind, "undo", "R4.1a the undo is an undo entry");
  eq(u?.undo?.of, "s1", "R4.1b and it names the first step");
  eq(u?.undo?.at, NOW, "R4.1c and it is stamped with now");
  const l1 = { ...l0, ...(u?.ledger ?? {}) };
  const after = [...(L3 ?? []), u?.undo];
  eq(state(step1, after, l1), "undone", "R4.1d the first row reads UNDONE once its undo is in the log");
  eq(state(step2, after, l1), "live", "R4.1e the second row stays live: its +1 is still in the count");
}
{
  const r = count("s1", T(10), K, 0, 1);
  eq(
    state(r, [r], ledger({ received: { [K]: 1 }, receivedAt: { [K]: T(10) } })),
    "live",
    "R4.2 a row is live while the card's time is at its time and the undo would change the count"
  );
  eq(
    state(r, [r], ledger({ received: { [K]: 1 }, receivedAt: { [K]: T(9) } })),
    "nothing",
    "R4.3 a row reads NOTHING TO UNDO once the card's time is older than the row"
  );
  eq(
    state(r, [r], ledger({ received: {}, receivedAt: {} })),
    "nothing",
    "R4.4 a row whose card has no time, as after a Reset, reads NOTHING TO UNDO"
  );
}
{
  const r = count("s1", T(10), K, 0, 1);
  const cur = ledger({ received: { [K]: 1 }, receivedAt: { [K]: T(20) } });
  const older = ledger({ received: {}, receivedAt: {} });
  const res = restampRestore(cur, older, NOW);
  const restored = ledger({ received: older.received, receivedAt: res.receivedAt, stamps: res.stamps, envelopes: res.envelopes });
  eq(res?.receivedAt?.[K], NOW, "R4.5pre the restore stamps the card now, so only the count can decide");
  eq(state(r, [r], restored), "nothing", "R4.5 after a restore to an older version, the row reads NOTHING TO UNDO");
}

/* ---------- R5 count undo ---------- */

{
  // a delta of 2 against a count of 1: the subtraction goes below zero
  const r = count("c1", T(10), K, 0, 2);
  const u = undo(r, ledger({ received: { [K]: 1 }, receivedAt: { [K]: T(11) } }));
  ok(
    !!u?.ledger?.received && !Object.hasOwn(u.ledger.received, K),
    "R5.1 an undo that would go below zero deletes the key, and does not store 0",
    `received ${canon(u?.ledger?.received)}`
  );
}
{
  // a delta of -2 against a count of 3 on a card of quantity 4: the sum goes past the quantity
  const r = count("c2", T(10), K, 4, 2);
  const u = undo(r, ledger({ received: { [K]: 3 }, receivedAt: { [K]: T(11) } }));
  eq(u?.ledger?.received?.[K], 4, "R5.2 an undo clamps the result to the card's quantity");
}
{
  const r = count("c3", T(10), K, 0, 1);
  const u = undo(r, ledger({ received: { [K]: 3 }, receivedAt: { [K]: T(11) } }));
  eq(u?.ledger?.received?.[K], 2, "R5.3 an undo takes only its own delta, so a later hand edit survives");
  eq(u?.ledger?.receivedAt?.[K], NOW, "R5.3a and the undo stamps the card with now");
}

/* ---------- R6 stamps, envelopes, assigns, bulk ---------- */

{
  const r = stamp("p1", T(10), GK, null, S("claim", T(10)), T(10));
  const l = ledger({ stamps: { [GK]: S("refunded", T(15)) } });
  eq(state(r, [r], l), "changed", "R6.1 a stamp written after the row reads CHANGED SINCE");
  eq(undo(r, l)?.refused, "changed", "R6.1a and its undo is refused as changed");
}
{
  const before = S("claim", T(5), "2026-09-20");
  const after = S("refunded", T(10));
  const r = stamp("p2", T(10), GK, before, after, T(10));
  const u = undo(r, ledger({ stamps: { [GK]: after } }));
  eq(u?.ledger?.stamps?.[GK]?.kind, "claim", "R6.2 a stamp undo writes the old stamp back");
  eq(u?.ledger?.stamps?.[GK]?.at, "2026-09-20", "R6.2a with its old date");
  eq(u?.ledger?.stamps?.[GK]?.updatedAt, NOW, "R6.2b and a fresh write time");
}
{
  const r = stamp("p3", T(10), GK, null, S("claim", T(10)), T(10));
  const u = undo(r, ledger({ stamps: { [GK]: S("claim", T(10)) } }));
  eq(u?.ledger?.stamps?.[GK]?.kind, "", "R6.3 undoing a stamp that did not exist writes a tombstone");
  eq(u?.ledger?.stamps?.[GK]?.updatedAt, NOW, "R6.3a with the undo's time");
}
{
  const e1 = E("e1", T(10));
  const r = env("v1", T(10), "record", null, e1, T(10));
  const u = undo(r, ledger({ envelopes: [e1] }));
  const got = u?.ledger?.envelopes?.find((e) => e?.id === "e1");
  ok(!!got?.deletedAt, "R6.4 undoing a record writes a discard tombstone", `envelope ${canon(got)}`);
  eq(got?.updatedAt, NOW, "R6.4a with the undo's time");
}
{
  const live1 = E("e2", T(5), [{ name: "Ponder", qty: 1 }]);
  const tomb = { ...live1, entries: [], deletedAt: T(10), updatedAt: T(10) };
  const r = env("v2", T(10), "discard", live1, tomb, T(10));
  const u = undo(r, ledger({ envelopes: [tomb] }));
  const got = u?.ledger?.envelopes?.find((e) => e?.id === "e2");
  ok(!!got && !got.deletedAt, "R6.5 undoing a discard writes the live copy back, not a tombstone", `envelope ${canon(got)}`);
  eq(got?.updatedAt, NOW, "R6.5a with a fresh time, so it beats the tombstone");
  eq(got?.entries, live1.entries, "R6.5b and with its entries");
}
{
  const older = E("e3", T(5), [{ name: "A", qty: 1 }]);
  const newer = E("e3", T(10), [{ name: "A", qty: 1 }, { name: "B", qty: 1 }]);
  const r = env("v3", T(10), "edit", older, newer, T(10));
  const u = undo(r, ledger({ envelopes: [newer] }));
  const got = u?.ledger?.envelopes?.find((e) => e?.id === "e3");
  eq(got?.entries, older.entries, "R6.6 undoing an edit writes the older copy back");
  eq(got?.updatedAt, NOW, "R6.6a with a fresh time");
}
{
  const older = E("e3", T(5), [{ name: "A", qty: 1 }]);
  const newer = E("e3", T(10), [{ name: "A", qty: 1 }, { name: "B", qty: 1 }]);
  const r = env("v3", T(10), "edit", older, newer, T(10));
  const l = ledger({ envelopes: [E("e3", T(20), [{ name: "C", qty: 1 }])] });
  eq(state(r, [r], l), "changed", "R6.7 an envelope edited since the row reads CHANGED SINCE");
  eq(undo(r, l)?.refused, "changed", "R6.7a and its undo is refused");
}
{
  // an assign takes two of Ponder's copies and leaves Urza; the envelope is restamped on the way
  const before = E("e4", T(5), [{ name: "Ponder", qty: 2 }, { name: "Urza", qty: 1 }]);
  const after = E("e4", T(10), [{ name: "Urza", qty: 1 }]);
  const r = assign("a1", T(10), [{ itemKey: K, take: 2 }], before, after, T(10));
  const l = ledger({ received: { [K]: 2 }, receivedAt: { [K]: T(10) }, envelopes: [after] });
  eq(state(r, [r], l), "live", "R6.8pre the assign reads live while its counts and envelope still hold");
  const u = undo(r, l);
  ok(!!u?.ledger?.received && !Object.hasOwn(u.ledger.received, K), "R6.8 an assign undo takes back its takes, so the count is gone");
  const got = u?.ledger?.envelopes?.find((e) => e?.id === "e4");
  eq(got?.entries, before.entries, "R6.8a and restores the envelope with its entries");
  eq(got?.updatedAt, NOW, "R6.8b with a fresh time");
}
{
  const before = E("e4", T(5), [{ name: "Ponder", qty: 2 }, { name: "Urza", qty: 1 }]);
  const after = E("e4", T(10), [{ name: "Urza", qty: 1 }]);
  const r = assign("a1", T(10), [{ itemKey: K, take: 2 }], before, after, T(10));
  const l = ledger({
    received: { [K]: 2 },
    receivedAt: { [K]: T(10) },
    envelopes: [E("e4", T(20), [{ name: "Urza", qty: 1 }])],
  });
  eq(undo(r, l)?.refused, "changed", "R6.9 an assign whose envelope changed since is refused whole, counts included");
}
{
  const r = bulk("b1", T(10), GK, [
    { key: K, before: 0, after: 1 },
    { key: K2, before: 0, after: 1 },
  ]);
  const l = ledger({ received: { [K]: 1, [K2]: 1 }, receivedAt: { [K]: T(10), [K2]: T(10) } });
  eq(state(r, [r], l), "live", "R6.10 a bulk check reads live while its cards still hold it");
  const u = undo(r, l);
  ok(
    !!u?.ledger?.received && !Object.hasOwn(u.ledger.received, K) && !Object.hasOwn(u.ledger.received, K2),
    "R6.10a and one undo takes back every card in it"
  );
}

/* ---------- R7 isLive ---------- */

eq(live([], ledger()), false, "R7.1 an empty log has nothing to undo");
eq(
  live([count("r1", T(10), K, 0, 1)], ledger({ received: { [K]: 1 }, receivedAt: { [K]: T(10) } })),
  true,
  "R7.2 a live row makes the log live"
);
{
  const log = [
    count("c1", T(10), K, 0, 1),
    count("c2", T(11), K2, 1, 0),
    stamp("s1", T(12), GK, null, S("claim", T(12)), T(12)),
    env("v1", T(13), "record", null, E("e9", T(13)), T(13)),
    assign("a1", T(14), [{ itemKey: K, take: 1 }], E("e8", T(5)), null, T(14)),
  ];
  eq(live(log, ledger()), false, "R7.3 after a Reset, which clears every card, stamp and envelope, nothing is live");
}
eq(
  live([count("r1", T(10), K, 0, 1), undoOf("u1", T(11), "r1")], ledger({ received: {}, receivedAt: { [K]: NOW } })),
  false,
  "R7.4 a log of only undone rows is not live"
);

/* ---------- R8 rowLabel ---------- */

eq(label(count("a", T(1), K, 0, 1)), "CHECKED", "R8.1 a check reads CHECKED");
eq(label(count("a", T(1), K, 1, 0)), "UN-CHECKED", "R8.2 an un-check reads UN-CHECKED");
eq(label(count("a", T(1), K, 2, 3)), "COUNT 2 → 3", "R8.3 a count change reads COUNT before → after");
eq(
  label(bulk("b", T(1), GK, [{ key: K, before: 0, after: 1 }])),
  "PACKAGE CHECKED",
  "R8.4 a bulk check reads PACKAGE CHECKED"
);
eq(
  label(stamp("s", T(1), GK, null, S("refunded", T(1)), T(1))),
  "STAMP · REFUNDED",
  "R8.5 a stamp reads STAMP · its kind"
);
eq(
  label(stamp("s", T(1), GK, S("claim", T(0)), null, T(1))),
  "STAMP REMOVED",
  "R8.6 a removed stamp reads STAMP REMOVED"
);
eq(label(env("v", T(1), "record", null, E("e", T(1)), T(1))), "ENVELOPE RECORDED", "R8.7 a recorded envelope reads ENVELOPE RECORDED");
eq(
  label(env("v", T(1), "edit", E("e", T(0)), E("e", T(1)), T(1))),
  "ENVELOPE EDITED",
  "R8.8 an edited envelope reads ENVELOPE EDITED"
);
eq(
  label(env("v", T(1), "discard", E("e", T(0)), { ...E("e", T(1)), deletedAt: T(1) }, T(1))),
  "ENVELOPE DISCARDED",
  "R8.9 a discarded envelope reads ENVELOPE DISCARDED"
);
eq(
  label(assign("a", T(1), [{ itemKey: K, take: 1 }], E("e", T(0)), null, T(1))),
  "ASSIGNED",
  "R8.10 an assign reads ASSIGNED"
);

/* ---------- R9 groupByDay, the local day ---------- */

// control: the zone is New York, so 03:00Z on 5 Oct is still 4 Oct there. It passes on any code.
eq(
  new Date(Date.UTC(2026, 9, 5, 3, 0)).getDate(),
  4,
  "R9.0 control: the run is in New York time, so 03:00Z on 5 Oct is 4 Oct locally"
);
{
  // 03:00Z on 5 Oct is 23:00 on 4 Oct locally, so it is YESTERDAY. On UTC days it would sit in TODAY.
  const late = count("late", Date.UTC(2026, 9, 5, 3, 0), K, 0, 1);
  const now = count("now", NOW, K2, 0, 1);
  const g = days([late, now], NOW);
  eq(labels(g), ["TODAY", "YESTERDAY"], "R9.1 an entry at 03:00Z is YESTERDAY in New York, not TODAY");
  eq(rowIds(g, 0), ["now"], "R9.1a TODAY holds the entry at 11:00 locally");
  eq(rowIds(g, 1), ["late"], "R9.1b and YESTERDAY holds the entry from 23:00 the night before");
}
{
  // 19:30 and 20:30 on 5 Oct locally fall on two UTC days, and on one local day
  const a = count("a", Date.UTC(2026, 9, 5, 23, 30), K, 0, 1);
  const b = count("b", Date.UTC(2026, 9, 6, 0, 30), K2, 0, 1);
  const later = Date.UTC(2026, 9, 6, 6, 0); // 02:00 on 6 Oct locally
  const today = count("today", later - MIN, K2, 0, 1); // 01:59 on 6 Oct locally
  const g = days([a, b, today], later);
  eq(labels(g), ["TODAY", "YESTERDAY"], "R9.2 two entries on local 5 Oct share one group, though they fall on two UTC days");
  eq(rowIds(g, 1), ["b", "a"], "R9.2a and that group lists the newest first");
}
{
  const old = count("old", Date.UTC(2026, 9, 3, 16, 0), K, 0, 1); // 12:00 on Sat 3 Oct locally
  const now = count("now", NOW, K2, 0, 1);
  eq(labels(days([now, old], NOW)), ["TODAY", "SAT OCT 3"], "R9.3 an older day takes its local date, and groups run newest first");
}
eq(days([], NOW), [], "R9.4 no entries, no groups");
{
  const g = days([count("now", NOW, K, 0, 1)], NOW);
  ok(
    Array.isArray(g) && g.length === 1 && Object.keys(g[0] ?? {}).sort().join(",") === "label,rows",
    "R9.5 groupByDay gives an array of { label, rows }, one object per group and no other keys",
    `groups ${canon(g)}`
  );
  ok(
    typeof g?.[0]?.label === "string" && Array.isArray(g?.[0]?.rows),
    "R9.5a with label a string and rows an array"
  );
}

/* ---------- R10 newEntryId ---------- */

{
  const made = Array.from({ length: 500 }, () => api("newEntryId")());
  eq(new Set(made).size, 500, "R10.1 newEntryId gives a new id on every call");
  ok(made.every((x) => typeof x === "string" && x.length > 0), "R10.2 and each id is a non-empty string");
}

/* ---------- report ---------- */

console.log(`module ${loadNote}`);
console.log(`\n${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  ✗ ${f}`);
if (fails.length) {
  console.log(failLine(fails.length, pass + fails.length));
  process.exit(1);
}
console.log("all green");
