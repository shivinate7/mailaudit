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
   DERIVED here. In particular there is no stored "daily" kind and
   nothing ever gets promoted — "the first version of each day" is
   computed at prune time, so it cannot drift out of step with the
   records the way a written-once flag would.
   ============================================================ */

const DAY = 86_400_000;

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
  /* the first version of each calendar day, kept for six months.
     This is what gives the list reach — the tiers above cover
     minutes and weeks, this one covers "restore last Tuesday". */
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

/* The earliest surviving record of each day, by id.

   Earliest and not latest: the point of a day anchor is "how things
   stood before that day's work", which is the state you want back
   when the whole day went wrong. Taking the last one of the day
   would keep the damage and drop the thing you were reaching for. */
export function dayAnchors(records) {
  const first = new Map();
  for (const r of records) {
    const k = dayKey(r.at);
    const held = first.get(k);
    if (!held || r.at < held.at) first.set(k, r);
  }
  return new Set([...first.values()].map((r) => r.id));
}

/* Three independent reasons to live, unioned — never intersected.
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
