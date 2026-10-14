/* Reconciling two devices' ledgers, as a pure function — the same trade
   `remote-rules.mjs`, `photo-rules.mjs` and `b64.mjs` make, and for the sharpest
   version of the same reason: this is the one piece of the sync that fails by
   producing a *plausible wrong ledger* rather than an error. A merge that
   silently drops 35 imported lines looks exactly like a merge that worked.

   WHY THIS EXISTS AT ALL. The two devices write different fields: the phone
   writes `received` and `envelopes`, the laptop imports CSVs and so writes
   `items`. The ledger is one blob under one sha, so that split buys nothing —
   and because pushing is manual, the phone's check-ins are usually unpushed
   when the laptop pushes an import. The result is a 409 whose only two
   resolutions both lose data: `Pull` discards the phone's check-ins,
   `Push anyway` discards the laptop's lines.

   This is not theoretical. `git log origin/data` records it happening:
   752 items → 717 (the laptop's 35 imported lines destroyed by a phone holding
   newer check-ins and a stale item list) → 752 again two hours later when the
   import was redone by hand.

   THE PROPERTY THAT MAKES IT SAFE: the later change wins. Line items union.
   Each check-in key and each envelope takes whichever device changed it last,
   so an un-check or a discard travels. Work is only ever replaced by a later
   change the user made on purpose, and the merge notice names every removal.
   Re-running it is harmless.

   Stamps follow the same rule: a stamp REMOVED on one device is a tombstone
   with a fresh `updatedAt`, and a newer tombstone beats an older stamp. That is
   the user's own removal propagating, not the merge deciding anything, and a
   resurrected `refunded` stamp would silently pull money back out of the
   tally. The merge counts it as a removal. See mergeStamps. */

/* Union of two line-item lists, keyed on `it.key`
   (`orderId|itemNumber|vendorProductId` — invariant saved-state-shape, stable across
   re-imports). This is also what a CSV import does to the existing list, so
   app.jsx's import path calls it too rather than keeping a second Map-union
   that could drift from this one.

   `base` wins a collision. Both sides derive items from the same TCGplayer
   scrape, so a collision is almost always byte-identical; preferring the
   caller's own copy means a merge never perturbs a line already on screen. */
export function mergeItems(base, incoming) {
  const map = new Map((base || []).map((it) => [it.key, it]));
  let added = 0;
  for (const it of incoming || []) {
    if (!it || !it.key) continue;
    if (!map.has(it.key)) {
      map.set(it.key, it);
      added++;
    }
  }
  return { items: [...map.values()], added };
}

/* Per-key, later change wins. `baseAt` / `incomingAt` map a key to the ms of its
   last change. A key ABSENT from `received` but carrying a time is an un-check.
   Equal times take the max count. If either side has no time for a key (a ledger
   from before `receivedAt`), the key falls back to the old per-key max, so an
   older ledger merges by the old rule, except that a timed absence beats an
   untimed count. `added` counts positive increases; `removed` counts keys whose
   count this merge lowered or cleared.
   The merged time map is the union, later time per key. */
export function mergeReceived(base, incoming, baseAt, incomingAt) {
  const bAt = baseAt || {};
  const iAt = incomingAt || {};
  const b = base || {};
  const i = incoming || {};
  const received = {};
  const receivedAt = {};
  let added = 0;
  let removed = 0;
  const keys = new Set([
    ...Object.keys(b),
    ...Object.keys(i),
    ...Object.keys(bAt),
    ...Object.keys(iAt),
  ]);
  for (const k of keys) {
    const mine = Number(b[k]) || 0;
    const theirs = Number(i[k]) || 0;
    const ta = Number(bAt[k]) || 0;
    const tb = Number(iAt[k]) || 0;
    let n;
    if (ta && tb && ta !== tb) n = ta > tb ? mine : theirs;
    else if (!ta !== !tb && !(ta ? mine : theirs)) n = 0; // a timed absence beats an untimed count
    else n = Math.max(mine, theirs);
    if (n > 0) received[k] = n;
    if (n > mine) added += n - mine;
    if (n < mine) removed++;
    if (ta || tb) receivedAt[k] = Math.max(ta, tb);
  }
  return { received, receivedAt, added, removed };
}

/* Union by id, newest-first by createdAt.

   A COLLISION IS NOT "take the bigger one". The obvious rule — prefer the copy
   with more entries, since an edit adds — is actively wrong, because assignment
   *shrinks* an envelope: checking cards in leaves only the unexplained entries
   behind. Preferring the larger copy would resurrect the entries that were just
   assigned away while `mergeReceived` also keeps the check-ins they produced,
   so the same cards would read as both received AND still sitting in the
   envelope. So the freshest write wins, by `updatedAt`, with the caller's own
   copy taking a tie.

   `updatedAt` is absent on every envelope written before this shipped, which is
   handled rather than migrated: absent reads as 0, so a copy that has been
   touched since beats one that hasn't, and two untouched copies tie to local.

   DELETION IS A TOMBSTONE: `deletedAt`, `entries: []`, `photos: []`, with a
   fresh `updatedAt`. It is an ordinary envelope here, so a newer tombstone beats
   an older live copy and a newer live edit beats an older tombstone. */
/* A discarded envelope is kept as a tombstone so the discard can travel. These
   two are the only places that know the shape; app.jsx calls them. */
export const isLiveEnvelope = (e) => !e?.deletedAt;
export const tombstoneOf = (e, now) => ({
  id: e.id,
  createdAt: e.createdAt,
  note: "",
  updatedAt: now,
  deletedAt: now,
  entries: [],
  photos: [],
});

export function mergeEnvelopes(base, incoming) {
  const stamp = (e) => Number(e?.updatedAt) || 0;
  const map = new Map();
  for (const e of base || []) if (e?.id) map.set(e.id, e);
  let added = 0;
  let removed = 0;
  for (const e of incoming || []) {
    if (!e?.id) continue;
    const mine = map.get(e.id);
    if (!mine) {
      map.set(e.id, { ...e, photos: e.photos || [] });
      if (isLiveEnvelope(e)) added++;
    } else if (stamp(e) > stamp(mine)) {
      if (isLiveEnvelope(mine) && !isLiveEnvelope(e)) removed++;
      map.set(e.id, { ...e, photos: e.photos || [] });
    }
  }
  return {
    envelopes: [...map.values()].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    ),
    added,
    removed,
  };
}

/* Per-package, freshest `updatedAt` wins, strictly — the caller's own copy
   takes a tie, as with envelopes. Keyed on the package gk (`orderId::seller`).

   Tombstones (`kind: ""`) are ordinary entries here: a newer tombstone removes
   an older stamp, an older tombstone loses to a newer stamp (re-stamping after
   a removal on the other device works). `added` counts stamps that ARRIVED,
   not tombstones that did — "1 stamp from the other device" must mean a stamp
   the user can see. Never prunes: a tombstone or an orphaned gk is a few bytes,
   and dropping one is exactly the resurrection it exists to prevent. */
export function mergeStamps(base, incoming) {
  const t = (s) => Number(s?.updatedAt) || 0;
  const out = { ...(base || {}) };
  let added = 0;
  let removed = 0;
  for (const [gk, s] of Object.entries(incoming || {})) {
    if (!s || typeof s !== "object") continue;
    const mine = out[gk];
    if (mine && t(s) <= t(mine)) continue; // strict >: local wins a tie
    out[gk] = s;
    if (s.kind) added++;
    else if (mine?.kind) removed++;
  }
  return { stamps: out, added, removed };
}

/* `local` is the device running the merge and wins every tie.

   Builds `merged` from NAMED fields, then carries every top-level key it does
   not know, so a key a newer build writes is not dropped by an older build's
   merge, applied as a full replace, and pushed back. A carried key held by one
   side is kept. Held by both with different values, incoming wins; no
   merge input carries `savedAt`, so no time is compared. Known keys are unchanged. A new
   persisted key still needs invariant saved-state-shape's five sites in
   app.jsx; this file only keeps an unnamed one alive.

   The three view preferences are deliberately NOT merged — local keeps its own.
   They describe how this screen is sorted and filtered, not what is true about
   the mail, and syncing them makes the phone's sort order jump because the
   laptop happened to be sorted differently. */
const KNOWN_KEYS = new Set([
  "mailday", "items", "received", "receivedAt", "envelopes", "stamps",
  "dateFilter", "sortBy", "itemSort",
]);

function carryUnknownKeys(local, incoming) {
  // Own-property checks and fromEntries keep names like constructor, toString
  // and __proto__ as data. `k in` and `out[k] =` would read or move the prototype.
  const keys = new Set([...Object.keys(local || {}), ...Object.keys(incoming || {})]);
  return Object.fromEntries(
    [...keys]
      .filter((k) => !KNOWN_KEYS.has(k))
      .map((k) => [k, incoming && Object.hasOwn(incoming, k) ? incoming[k] : local[k]])
  );
}

export function mergeLedger(local, incoming) {
  const items = mergeItems(local?.items, incoming?.items);
  const received = mergeReceived(
    local?.received,
    incoming?.received,
    local?.receivedAt,
    incoming?.receivedAt
  );
  const envelopes = mergeEnvelopes(local?.envelopes, incoming?.envelopes);
  const stamps = mergeStamps(local?.stamps, incoming?.stamps);
  return {
    merged: {
      ...carryUnknownKeys(local, incoming),
      mailday: 1,
      items: items.items,
      received: received.received,
      receivedAt: received.receivedAt,
      envelopes: envelopes.envelopes,
      stamps: stamps.stamps,
      dateFilter: local?.dateFilter,
      sortBy: local?.sortBy,
      itemSort: local?.itemSort,
    },
    stats: {
      itemsAdded: items.added,
      checkInsAdded: received.added,
      envelopesAdded: envelopes.added,
      checkInsRemoved: received.removed,
      envelopesRemoved: envelopes.removed,
      stampsRemoved: stamps.removed,
      stampsAdded: stamps.added,
    },
  };
}

/* Phrasing for the merge notice. Here rather than in app.jsx because it is
   pure, it is the thing the user actually reads to decide whether the merge did
   what they wanted, and "nothing new" is a genuinely useful thing to be told
   after a conflict — it means the other device was merely ahead, not divergent. */
export function mergeSummary(stats) {
  const bits = [];
  if (stats.itemsAdded)
    bits.push(`${stats.itemsAdded} new line${stats.itemsAdded === 1 ? "" : "s"}`);
  if (stats.checkInsAdded)
    bits.push(
      `${stats.checkInsAdded} check-in${stats.checkInsAdded === 1 ? "" : "s"}`
    );
  if (stats.envelopesAdded)
    bits.push(
      `${stats.envelopesAdded} envelope${stats.envelopesAdded === 1 ? "" : "s"}`
    );
  if (stats.stampsAdded)
    bits.push(`${stats.stampsAdded} stamp${stats.stampsAdded === 1 ? "" : "s"}`);
  const gone = [];
  if (stats.checkInsRemoved)
    gone.push(
      `un-checked ${stats.checkInsRemoved} card${stats.checkInsRemoved === 1 ? "" : "s"}`
    );
  if (stats.envelopesRemoved)
    gone.push(
      `${stats.envelopesRemoved} envelope${stats.envelopesRemoved === 1 ? "" : "s"}`
    );
  if (stats.stampsRemoved)
    gone.push(
      `${stats.stampsRemoved} stamp${stats.stampsRemoved === 1 ? "" : "s"}`
    );
  const removal = gone.length
    ? ` Removed by the other device's later changes: ${gone.join(", ")}.`
    : "";
  if (!bits.length)
    return removal
      ? `Merged.${removal}`
      : "Merged \u2014 the other device had nothing new.";
  const list =
    bits.length === 1
      ? bits[0]
      : `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
  return `Merged \u2014 ${list} from the other device.${
    removal || " Nothing of yours was lost."
  }`;
}

/* Key-order-independent form; array order still counts, so a reorder reads as changed (safe: one extra write). */
export const canon = (v) =>
  JSON.stringify(v, (_, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))
      : x);
