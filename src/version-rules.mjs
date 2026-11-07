/* ============================================================
   Which saved versions survive, and which are dropped.

   Its own module for the reason b64.mjs, merge-rules.mjs,
   photo-rules.mjs and remote-rules.mjs are: this fails by producing
   a *plausible wrong result* rather than an error. A pruning bug
   deletes the one version the user needed and leaves a list that
   looks perfectly healthy — there is nothing to notice until the
   moment it matters, which is the moment it can't be fixed. So it
   is pure, and directly tested.

   The model is deliberately small: a record carries only when it
   was taken and whether it was a milestone. Everything else is
   DERIVED here. In particular there is no stored "daily" or
   "hourly" kind and nothing ever gets promoted — "the first version
   of each hour/day" is computed at prune time, so it cannot drift
   out of step with the records the way a written-once flag would.
   ============================================================ */

const DAY = 86_400_000;
const HOUR = 3_600_000;

export const RETENTION = {
  /* the current session's check-ins. Twenty at ~30s apart is roughly
     ten minutes of work, which is the window in which "undo what I
     just did" is the question being asked. */
  recentKeep: 20,
  /* taken before each bulk operation — import, sync, restore, reset.
     These are the ones with a name you can read, and the ones that
     sit in front of the four things that can lose data in bulk. */
  milestoneDays: 30,
  /* a belt beside the braces: thirty days of a heavy import habit
     shouldn't be able to outgrow the budget on its own */
  milestoneMax: 60,
  /* the first version of each hour, for a day. This is the tier
     that closes the gap the other three leave: the ring covers ten
     to thirty minutes of dense work before it churns out, and the
     day anchor covers this morning, so without this the honest
     answer to "put it back to how it was at 11am" was "you can't".
     24 more records, roughly 600KB gzipped — the cheapest tier
     here by some way, and the one that matches how a mail day
     actually goes wrong. */
  hourHours: 24,
  /* the first version of each calendar day, kept for six months.
     This is what gives the list reach — the tiers above cover
     minutes, hours and weeks; this one covers "restore last
     Tuesday". */
  dayDays: 180,
};

/* Local calendar day, and local on purpose. `at` is a Date.now()
   instant rather than a date string, so the local getters are the
   correct reading of "which day was this taken on" — the UTC trap
   that bites elsewhere in this app (test 23.16) is a parsing
   problem, and there is no parsing here. */
export function dayKey(at) {
  const d = new Date(at);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* Local calendar hour, on the same reasoning as dayKey. */
export function hourKey(at) {
  return `${dayKey(at)}T${String(new Date(at).getHours()).padStart(2, "0")}`;
}

/* The earliest surviving record of each bucket, by id.

   EARLIEST and not latest, and this is the whole point of an anchor:
   what you want back is how things stood *before* the stretch that
   went wrong, not after it. Taking the last record of the bucket
   would preserve the damage and drop the thing you were reaching
   for. Shared by the hour and day tiers so the two cannot drift. */
export function earliestPer(records, keyOf) {
  const first = new Map();
  for (const r of records) {
    const k = keyOf(r.at);
    const held = first.get(k);
    if (!held || r.at < held.at) first.set(k, r);
  }
  return new Set([...first.values()].map((r) => r.id));
}

export const dayAnchors = (records) => earliestPer(records, dayKey);
export const hourAnchors = (records) => earliestPer(records, hourKey);

/* Four independent reasons to live, unioned — never intersected.
   A record kept by any one rule is kept, so the tiers can't cancel
   each other out: the day anchor outliving the recent ring is the
   normal case, not an edge one. */
export function keptIds(records, now = Date.now(), policy = RETENTION) {
  const keep = new Set();

  const recents = records
    .filter((r) => r.kind !== "milestone")
    .sort((a, b) => b.at - a.at);
  for (const r of recents.slice(0, policy.recentKeep)) keep.add(r.id);

  const milestones = records
    .filter((r) => r.kind === "milestone" && now - r.at <= policy.milestoneDays * DAY)
    .sort((a, b) => b.at - a.at);
  for (const r of milestones.slice(0, policy.milestoneMax)) keep.add(r.id);

  const today = records.filter((r) => now - r.at <= policy.hourHours * HOUR);
  for (const id of hourAnchors(today)) keep.add(id);

  const fresh = records.filter((r) => now - r.at <= policy.dayDays * DAY);
  for (const id of dayAnchors(fresh)) keep.add(id);

  return keep;
}

/* What to delete. Expressed as the complement of keptIds rather than
   as its own set of rules, so there is exactly one place that decides
   and no way for "kept" and "dropped" to both be true. */
export function prunePlan(records, now = Date.now(), policy = RETENTION) {
  const keep = keptIds(records, now, policy);
  return records.filter((r) => !keep.has(r.id)).map((r) => r.id);
}

/* Is this change worth its own version?

   The ledger is re-saved on a 500ms debounce and a mail day is
   hundreds of taps, so snapshotting every save would spend the whole
   ring buffer on one package. A milestone always writes — it is
   standing in front of an operation that can lose data, and missing
   one costs the thing it was there to protect. */
export function shouldSnapshot(kind, lastAt, now = Date.now(), minGapMs = 30_000) {
  if (kind === "milestone") return true;
  return lastAt == null || now - lastAt >= minGapMs;
}

/* Does the incoming ledger take away something the held one has?

   The "before sync" milestone hangs on this answer: a reply that removes
   something must get its version first, and a wrong "no" is a silent loss.
   Native asks this one rule through the bundle (rules-run-in-javascriptcore),
   so the Swift side holds no copy of it.

   It compares the two ledgers RAW, not through the merge stats the web reads
   (checkInsRemoved, envelopesRemoved, stampsRemoved) — the rule native has
   always kept. Each argument is { received, envelopes, stamps }. Three ways to
   remove: a count lowered or cleared; a live envelope gone or tombstoned; a
   stamp that held a kind and now has none or "". A tombstone is any deletedAt
   key, null included, as it was in Swift. */
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const envelopeList = (v) => (Array.isArray(v) && v.every(isObj) ? v : []);
const idOf = (e) => (typeof e.id === "string" ? e.id : null);
const kindOf = (s) => (isObj(s) && typeof s.kind === "string" ? s.kind : "");

export function removesSomething(held, incoming) {
  const heldReceived = isObj(held?.received) ? held.received : {};
  const inReceived = isObj(incoming?.received) ? incoming.received : {};
  for (const [k, n] of Object.entries(heldReceived)) {
    if (typeof n !== "number") continue;
    const now = typeof inReceived[k] === "number" ? Math.trunc(inReceived[k]) : 0;
    if (now < n) return true;
  }

  const inEnvelopes = envelopeList(incoming?.envelopes);
  for (const e of envelopeList(held?.envelopes)) {
    if ("deletedAt" in e) continue;
    const id = idOf(e);
    if (!inEnvelopes.some((x) => idOf(x) === id && !("deletedAt" in x))) return true;
  }

  const heldStamps = isObj(held?.stamps) ? held.stamps : {};
  const inStamps = isObj(incoming?.stamps) ? incoming.stamps : {};
  for (const [gk, s] of Object.entries(heldStamps)) {
    if (kindOf(s) !== "" && kindOf(inStamps[gk]) === "") return true;
  }
  return false;
}
