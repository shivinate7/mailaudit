/* The Recent log, as pure rules (decision recent-checks-can-be-undone, plan recent-log-web).
   Nothing here touches React, storage or the clock: a function that needs a time takes `now`.
   The log is one list of entries inside the ledger, under the key `recent`. `mergeLedger` calls
   `mergeRecent`, so the Worker and the web app share one union and one cap.

   An undo is a new, later write: it subtracts the row's own delta (counts) or writes the
   `before` value only while the subject's last write is still this row's write (stamps,
   envelopes). It never restores a snapshot.

   This file imports `tombstoneOf` from merge-rules.mjs, and merge-rules.mjs imports
   `mergeRecent` from here. The cycle is safe: both are used only inside function bodies. */

import { tombstoneOf, isLiveEnvelope } from "./merge-rules.mjs";
import { gkOf } from "./view-rules.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;
export const RECENT_DAYS = 14;
export const RECENT_ROWS = 200;
const KINDS = new Set(["count", "bulk", "stamp", "envelope", "assign", "undo"]);

const byTime = (x, y) => x.at - y.at || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
const isEntry = (e) =>
  !!e && typeof e === "object" && typeof e.id === "string" && e.id !== "" && Number.isFinite(e.at) && KINDS.has(e.kind);

/* A list read from storage or the wire: anything that is not a readable entry is dropped. */
export const sanitizeRecent = (v) => (Array.isArray(v) ? v.filter(isEntry) : []);

let idSeq = 0;
/* unique across devices: time, a counter for this page, and random bits */
export function newEntryId() {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${(idSeq++).toString(36)}-${rand}`;
}

/* Append `entry`. A count merges into the entry `lastId` names when that entry is a count on the
   same key, nothing came between (lastId is the id this session wrote last), no undo names it,
   and the count it left is the count this one started from (a merge or a hand edit in between
   breaks the chain). The merged entry keeps its id and first before, and takes the last after
   and time. One with no net change is kept: it still outranks a server copy of its first step in a
   merge (later time wins), and rowState reads it as "nothing". */
export function addEntry(log, entry, lastId) {
  const list = log || [];
  if (entry.kind === "count" && lastId != null) {
    const last = list.find((e) => e.id === lastId);
    if (
      last &&
      last.kind === "count" &&
      last.key === entry.key &&
      last.after === entry.before &&
      !list.some((e) => e.kind === "undo" && e.of === last.id)
    ) {
      const merged = { ...last, after: entry.after, at: entry.at };
      return { log: list.map((e) => (e.id === last.id ? merged : e)), lastId: last.id };
    }
  }
  return { log: [...list, entry], lastId: entry.id };
}

/* 14 days, then the newest 200 rows (undo entries do not count), then drop undo entries whose
   row is gone. Depends only on the set and `now`, so the merge is the same from either side. */
export function capLog(log, now) {
  const fresh = sanitizeRecent(log)
    .filter((e) => e.at >= now - RECENT_DAYS * DAY_MS)
    .sort(byTime);
  const rows = fresh.filter((e) => e.kind !== "undo").slice(-RECENT_ROWS);
  const kept = new Set(rows.map((e) => e.id));
  return fresh.filter((e) => (e.kind === "undo" ? kept.has(e.of) : kept.has(e.id)));
}

/* Union by id. On one id the later time wins; on a tie, `a`. Then the cap. */
export function mergeRecent(a, b, now) {
  const map = new Map();
  for (const e of sanitizeRecent(a)) map.set(e.id, e);
  for (const e of sanitizeRecent(b)) {
    const mine = map.get(e.id);
    if (!mine || e.at > mine.at) map.set(e.id, e);
  }
  return capLog([...map.values()], now);
}

/* ---------- reading the ledger ---------- */

/* key -> item and gk -> first item, built once per items array */
const indexes = new WeakMap();
function indexOf(items) {
  const list = items || [];
  let ix = indexes.get(list);
  if (!ix) {
    ix = { byKey: new Map(), byGk: new Map() };
    for (const it of list) {
      if (!it) continue;
      if (!ix.byKey.has(it.key)) ix.byKey.set(it.key, it);
      const gk = gkOf(it);
      if (!ix.byGk.has(gk)) ix.byGk.set(gk, it);
    }
    indexes.set(list, ix);
  }
  return ix;
}
const qtyOf = (ledger, key) => {
  const it = indexOf(ledger.items).byKey.get(key);
  return it ? it.qty : Infinity;
};
const clamp = (n, hi) => Math.max(0, Math.min(n, hi));
const nextCount = (cur, delta, qty) => clamp(cur - delta, qty);

/* What one entry wrote to a card, as [{ key, d }] with d the count it added (negative for a
   removal). An undo entry writes nothing of its own here: see touchedAt. */
function writesOf(e) {
  if (e.kind === "count") return [{ key: e.key, d: e.after - e.before }];
  if (e.kind === "bulk") return (e.counts || []).map((c) => ({ key: c.key, d: c.after - c.before }));
  if (e.kind === "assign") return (e.plan || []).map((p) => ({ key: p.itemKey, d: Number(p.take) || 0 }));
  return [];
}

/* The time of the newest entry that touched `key`: a count, bulk or assign that wrote it, or an
   undo of one that did. 0 when none did. */
function touchedAt(log, key) {
  const byId = new Map(log.map((e) => [e.id, e]));
  let at = 0;
  for (const e of log) {
    const row = e.kind === "undo" ? byId.get(e.of) : e;
    if (row && writesOf(row).some((w) => w.key === key)) at = Math.max(at, e.at);
  }
  return at;
}

/* the count an undo would leave, for one card of a row, or null when a guard or the clamp leaves
   it as it is. `log` is the whole log, or null when the caller has none (the row then stands
   alone, and the card's time need only not be older than the row). With a log:
   - the card's receivedAt is the time of the newest entry that touched it. A later receivedAt
     means a write the log did not see (a restore, a merge): the row stays live only while the
     card still holds the count the row left;
   - no later write of another row moved the card the opposite way (a later write that an undo
     entry names no longer counts);
   and either way:
   - a removal row's undo never takes the card above max(before, after) of the row. */
function countUndo(ledger, key, row, log) {
  const { before, after } = row;
  const d = after - before;
  if (d === 0) return null;
  const cur = Number(ledger.received?.[key]) || 0;
  const rAt = Number(ledger.receivedAt?.[key]) || 0;
  if (!log) {
    if (rAt < row.at) return null;
  } else {
    const newest = Math.max(row.at, touchedAt(log, key));
    if (rAt < newest || (rAt > newest && cur !== after)) return null;
    const undone = new Set(log.filter((e) => e.kind === "undo").map((e) => e.of));
    const opposite = log.some(
      (e) =>
        e.id !== row.id &&
        e.kind !== "undo" &&
        !undone.has(e.id) &&
        byTime(e, row) > 0 &&
        writesOf(e).some((w) => w.key === key && w.d * d < 0)
    );
    if (opposite) return null;
  }
  let next = nextCount(cur, d, qtyOf(ledger, key));
  if (d < 0) next = Math.min(next, before);
  return next === cur ? null : next;
}

const envelopeOf = (ledger, id) => (ledger.envelopes || []).find((e) => e?.id === id);
const subjectEnvelopeId = (entry) => (entry.after || entry.before)?.id ?? entry.before?.id;

/* "live", "undone", "changed" or "nothing". An undo entry naming the row is "undone" before
   anything else. */
export function rowState(entry, log, ledger) {
  if ((log || []).some((e) => e.kind === "undo" && e.of === entry.id)) return "undone";
  const L = ledger || {};
  switch (entry.kind) {
    case "count":
      return countUndo(L, entry.key, entry, log || null) == null ? "nothing" : "live";
    case "bulk":
      return (entry.counts || []).some((c) => countUndo(L, c.key, { ...c, id: entry.id, at: entry.at }, log || null) != null)
        ? "live"
        : "nothing";
    case "stamp": {
      const cur = L.stamps?.[entry.gk];
      if (!cur) return "nothing";
      return (Number(cur.updatedAt) || 0) === (Number(entry.updatedAt) || 0) ? "live" : "changed";
    }
    case "envelope":
    case "assign": {
      const cur = envelopeOf(L, subjectEnvelopeId(entry));
      if (!cur) return "nothing";
      return (Number(cur.updatedAt) || 0) === (Number(entry.updatedAt) || 0) ? "live" : "changed";
    }
    default:
      return "nothing";
  }
}

export const isLive = (log, ledger) =>
  (log || []).some((e) => e.kind !== "undo" && rowState(e, log, ledger) === "live");

/* A row whose card or package is not in the ledger is not listed. */
export function rowListed(entry, ledger) {
  const ix = indexOf(ledger?.items);
  if (entry.kind === "count") return ix.byKey.has(entry.key);
  if (entry.kind === "bulk" || entry.kind === "stamp") return ix.byGk.has(entry.gk);
  return true;
}

/* ---------- the inverse of each kind ---------- */

/* Returns { ledger, undo } or { refused: state }. `ledger` holds the four fields an undo can
   write. `opts.log` is the whole log, which the count guards read; without it the row stands alone.
   `opts.hasPhoto(id)` says whether this device holds a photo blob; without it every id
   is kept. An envelope that loses a photo id gives an undo entry with `photoLost`. */
export function undoEntry(entry, ledger, now, opts = {}) {
  const log = opts.log || null;
  const state = rowState(entry, log, ledger);
  if (state !== "live") return { refused: state };
  const received = { ...(ledger.received || {}) };
  const receivedAt = { ...(ledger.receivedAt || {}) };
  const stamps = { ...(ledger.stamps || {}) };
  let envelopes = ledger.envelopes || [];
  let photoLost = 0;

  const setCount = (key, n) => {
    if (n > 0) received[key] = n;
    else delete received[key];
    receivedAt[key] = now;
  };
  const putEnvelope = (env) => {
    envelopes = envelopes.some((e) => e.id === env.id)
      ? envelopes.map((e) => (e.id === env.id ? env : e))
      : [env, ...envelopes];
  };
  const restoreEnvelope = (before) => {
    const all = before.photos || [];
    const photos = opts.hasPhoto ? all.filter((id) => typeof id !== "string" || opts.hasPhoto(id)) : all;
    photoLost += all.length - photos.length;
    putEnvelope({ ...before, photos, updatedAt: now });
  };

  if (entry.kind === "count") {
    setCount(entry.key, countUndo(ledger, entry.key, entry, log));
  } else if (entry.kind === "bulk") {
    for (const c of entry.counts || []) {
      const n = countUndo(ledger, c.key, { ...c, id: entry.id, at: entry.at }, log);
      if (n != null) setCount(c.key, n);
    }
  } else if (entry.kind === "stamp") {
    stamps[entry.gk] = entry.before?.kind
      ? { ...entry.before, updatedAt: now }
      : { kind: "", note: "", at: "", updatedAt: now };
  } else if (entry.kind === "envelope") {
    const cur = envelopeOf(ledger, subjectEnvelopeId(entry));
    if (entry.op === "record") putEnvelope(tombstoneOf(cur, now));
    else restoreEnvelope(entry.before); // an edit returns the older copy, a discard the live one
  } else if (entry.kind === "assign") {
    for (const { itemKey, take } of entry.plan || []) {
      const cur = Number(received[itemKey]) || 0;
      setCount(itemKey, nextCount(cur, take, qtyOf(ledger, itemKey)));
    }
    restoreEnvelope(entry.before);
  }

  const undo = { id: newEntryId(), at: now, kind: "undo", of: entry.id };
  if (photoLost) undo.photoLost = photoLost;
  return { ledger: { received, receivedAt, stamps, envelopes }, undo };
}

/* ---------- words and grouping ---------- */

export function rowLabel(entry) {
  switch (entry.kind) {
    case "count":
      if (entry.after === 0) return "UN-CHECKED";
      if (entry.before === 0) return "CHECKED";
      return `COUNT ${entry.before} → ${entry.after}`;
    case "bulk":
      return (entry.counts || []).every((c) => c.after >= c.before) ? "PACKAGE CHECKED" : "PACKAGE CLEARED";
    case "stamp":
      return entry.after?.kind ? `STAMP · ${String(entry.after.kind).toUpperCase()}` : "STAMP REMOVED";
    case "envelope":
      return entry.op === "record" ? "ENVELOPE RECORDED" : entry.op === "edit" ? "ENVELOPE EDITED" : "ENVELOPE DISCARDED";
    case "assign":
      return "ASSIGNED";
    default:
      return "";
  }
}

const cardsWord = (n) => `${n} card${n === 1 ? "" : "s"}`;
const entriesQty = (env) => (env?.entries || []).reduce((s, e) => s + (Number(e.qty) || 0), 0);
const splitGk = (gk) => {
  const i = String(gk).indexOf("::");
  return i < 0 ? { orderId: "", seller: String(gk) } : { orderId: gk.slice(0, i), seller: gk.slice(i + 2) };
};

/* What a row says besides its label and time: { subject, figure, seller }. The seller line is
   the fact the owner forgets; a package or stamp names its order there. */
export function rowView(entry, ledger) {
  const ix = indexOf(ledger?.items);
  if (entry.kind === "count") {
    const it = ix.byKey.get(entry.key);
    return { subject: it?.name ?? "", figure: `${entry.after} of ${it?.qty ?? "?"}`, seller: it?.seller ?? "" };
  }
  if (entry.kind === "bulk") {
    const { orderId, seller } = splitGk(entry.gk);
    return { subject: seller, figure: cardsWord((entry.counts || []).length), seller: orderId ? `Order ${orderId}` : "" };
  }
  if (entry.kind === "stamp") {
    const { orderId, seller } = splitGk(entry.gk);
    return { subject: seller, figure: "", seller: orderId ? `Order ${orderId}` : "" };
  }
  const env = entry.after && isLiveEnvelope(entry.after) ? entry.after : entry.before || entry.after;
  const names = (entry.before?.entries || env?.entries || []).map((e) => e.name).join(", ");
  if (entry.kind === "assign") {
    const plan = entry.plan || [];
    const sellers = [...new Set(plan.map((p) => ix.byKey.get(p.itemKey)?.seller).filter(Boolean))];
    return {
      subject: env?.note || names || "Envelope",
      figure: cardsWord(plan.reduce((s, p) => s + (Number(p.take) || 0), 0)),
      seller: sellers.join(", "),
    };
  }
  return { subject: env?.note || names || "Envelope", figure: cardsWord(entriesQty(entry.before || env)), seller: names };
}

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const dayNum = (d) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();

/* Groups of one local calendar day, newest first: TODAY, YESTERDAY, then MON OCT 5.
   [{ label, rows }], rows newest first. */
export function groupByDay(rows, now) {
  const today = dayNum(new Date(now));
  const t = new Date(now);
  const yesterday = dayNum(new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1));
  const sorted = [...(rows || [])].sort((x, y) => byTime(y, x));
  const groups = [];
  for (const r of sorted) {
    const d = new Date(r.at);
    const n = dayNum(d);
    const label =
      n === today ? "TODAY" : n === yesterday ? "YESTERDAY" : `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`;
    const last = groups[groups.length - 1];
    if (last && last.n === n) last.rows.push(r);
    else groups.push({ n, label, rows: [r] });
  }
  return groups.map(({ label, rows: rs }) => ({ label, rows: rs }));
}
