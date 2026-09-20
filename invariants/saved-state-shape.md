# Saved-state shape is fixed

The saved ledger has one named shape, with items, received, envelopes, stamps, and view preferences as its fields. A new persisted key must be optional and defaulted, so an older save keeps loading. Adding a persisted key means touching five sites in the app, plus a sixth in the merge rules. Miss one of these sites, and a stale value silently survives a save or a merge, then gets pushed to the other device.

## The argument, as recorded

```
2. **Saved-state shape:** `{ items, received, envelopes, stamps, dateFilter,
   sortBy, itemSort, savedAt }`. `items` = array of parsed line items;
   `received` = map of item key → count received; `envelopes` = orphaned-mail
   records, each `{ id, createdAt, note, entries: [{ name, qty }],
   photos: [photoId], updatedAt }`. `updatedAt` is what lets the two-device
   merge tell a real edit from a stale copy of the same envelope; it is optional
   and defaulted (absent reads as 0), so envelopes written before it shipped
   keep loading untouched. It costs nothing under the five-site rule below
   because it lives *inside* `envelopes`, which is already persisted.
   `stamps` = map of **package** key (`gkOf`: `orderId::seller`, never
   `it.key`) → `{ kind, at, note, updatedAt }`, one per package; `kind` is one
   of `claim | refunded | contacted | reshipped | partial | other`, `at` the local
   calendar day it was set. **`kind: ""` is a tombstone** — a removal, kept so
   it can win a merge — and every reader goes through `hasStamp`, never key
   presence. Absent on older saves; defaulted to `{}` through
   `sanitizeStamps`, because `parseLedger` validates only `mailday` and
   `items`.
   Item key = `orderId|itemNumber|vendorProductId` — stable across re-imports;
   never change its construction. Envelope entries store card **names**, never
   item keys, so a re-import can't rot them and newly imported older orders
   become candidates for free.
   New keys must be optional and defaulted in the load path (as `itemSort`,
   `envelopes` and `photos` are), so saved states written by older builds keep
   loading. `itemSort` briefly shipped as `cardSort`; the load path still reads
   that key as a fallback.
   Saved **versions** cost nothing here, and that is by construction:
   `takeVersion` is a third *reader* of `snapshot()` rather than a fourth
   builder, and every restore path — file, pull, merge and the History list —
   funnels through `applyBackup`. `stamps` is the proof: it shipped after the
   version list and needed no change to it. Give the list its own payload
   builder and the next person to add a persisted key silently ships a rollback
   that drops it. Test 39.8b.
   Adding a persisted key means touching **five** sites:
   the load effect, the save payload + its dep array, `backup`, the JSON restore
   branch, and `resetAll` — miss the last one and the next debounced save writes
   the stale value straight back. Photo *blobs* are not in here at all; only
   their ids are (see Envelope photos below).
   The count stays **five**, not six, because the download and the GitHub push
   share one payload builder — `snapshot()`. Give the push its own and the next
   person to add a key misses one. The push carries no timestamp for the same
   reason: it goes in the commit message instead, so the pushed bytes stay
   identical to what the Backup file has always contained.
   **Plus one outside `app.jsx`:** `mergeLedger` in `merge-rules.mjs` builds
   the merged ledger from named fields, so a key it does not name is dropped by
   every merge, applied as a full replace, and pushed — both devices lose it.
   `stamps` was the first key added after that builder existed; test 37.62
   pins the key's presence. A related rollout hazard: an older build's
   `snapshot()` omits `stamps`, so its next push publishes a ledger without
   them and a Pull onto the new build wipes them (a Merge keeps the local
   ones). Update both devices before stamping anything.
```
