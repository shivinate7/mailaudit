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

   THE PROPERTY THAT MAKES IT SAFE: the merge only ever ADDS. Line items union,
   check-in counts take the max, envelopes union. Nothing is dropped and no
   count ever decreases, so applying it can lose neither device's work — which
   is why it needs no two-tap confirm, and why re-running it is harmless.

   One deliberate exception: a stamp REMOVED on one device is a tombstone with
   a fresh `updatedAt`, and a newer tombstone beats an older stamp. That is
   still "freshest write wins" — the user's own removal propagating, not the
   merge deciding anything — and it is there because a resurrected `refunded`
   stamp would silently pull money back out of the tally. See mergeStamps. */

/* Union of two line-item lists, keyed on `it.key`
   (`orderId|itemNumber|vendorProductId` — invariant 2, stable across
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

/* Per-key max.

   Right because every writer of this map is additive in practice: assignment
   does `next[key] = cur + take`, the stepper walks a count up, "Mark all
   received" sets it to the line's full qty. Taking the larger of two counts
   therefore keeps both devices' check-ins.

   The one thing it gets wrong is a deliberate UN-check — "Clear check-ins", or
   stepping a qty back down to 0 — racing the other device's stale copy: the
   card comes back checked. That is a visible, one-tap-to-fix wart, and the
   alternative (per-key timestamps) is a schema change bought to serve a case
   that a phone-only-checks-in workflow barely produces. If it ever does bite,
   `receivedAt` is an additive optional key and this is the function to change. */
export function mergeReceived(base, incoming) {
  const out = { ...(base || {}) };
  let added = 0;
  for (const [key, n] of Object.entries(incoming || {})) {
    const mine = out[key] || 0;
    const theirs = Number(n) || 0;
    if (theirs > mine) {
      added += theirs - mine;
      out[key] = theirs;
    }
  }
  return { received: out, added };
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

   DELETION IS NOT REPRESENTED, deliberately. Discarding an envelope, or
   assigning one away completely, leaves nothing behind to distinguish "deleted
   here" from "created there" — so a discarded envelope the other device still
   holds comes back. That bias is chosen: an envelope's entries are hand-typed
   and exist nowhere else, and invariant 7 means a stray envelope decides
   nothing on its own. Resurrecting one costs a tap to discard again; dropping
   one costs data the user typed. */
export function mergeEnvelopes(base, incoming) {
  const stamp = (e) => Number(e?.updatedAt) || 0;
  const map = new Map();
  for (const e of base || []) if (e?.id) map.set(e.id, e);
  let added = 0;
  for (const e of incoming || []) {
    if (!e?.id) continue;
    const mine = map.get(e.id);
    if (!mine) {
      map.set(e.id, { ...e, photos: e.photos || [] });
      added++;
    } else if (stamp(e) > stamp(mine)) {
      map.set(e.id, { ...e, photos: e.photos || [] });
    }
  }
  return {
    envelopes: [...map.values()].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    ),
    added,
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
  for (const [gk, s] of Object.entries(incoming || {})) {
    if (!s || typeof s !== "object") continue;
    const mine = out[gk];
    if (mine && t(s) <= t(mine)) continue; // strict >: local wins a tie
    out[gk] = s;
    if (s.kind) added++;
  }
  return { stamps: out, added };
}

/* `local` is the device running the merge and wins every tie.

   Builds `merged` from NAMED fields. That is deliberate — a payload is never
   spread through, so nothing unexpected rides along — but it means a new
   persisted key that is not named here is dropped by every merge, applied
   locally as a full replace, and then pushed. Invariant 2's five sites in
   app.jsx are this file's sixth.

   The three view preferences are deliberately NOT merged — local keeps its own.
   They describe how this screen is sorted and filtered, not what is true about
   the mail, and syncing them makes the phone's sort order jump because the
   laptop happened to be sorted differently. */
export function mergeLedger(local, incoming) {
  const items = mergeItems(local?.items, incoming?.items);
  const received = mergeReceived(local?.received, incoming?.received);
  const envelopes = mergeEnvelopes(local?.envelopes, incoming?.envelopes);
  const stamps = mergeStamps(local?.stamps, incoming?.stamps);
  return {
    merged: {
      mailday: 1,
      items: items.items,
      received: received.received,
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
  if (!bits.length) return "Merged — the other device had nothing new.";
  const list =
    bits.length === 1
      ? bits[0]
      : `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
  return `Merged — ${list} from the other device. Nothing of yours was lost.`;
}
