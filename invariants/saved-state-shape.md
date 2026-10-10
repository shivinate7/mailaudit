# Saved-state shape is fixed

The saved ledger has one named shape. Its fields are the ledger data and the view preferences: `{ items, received, envelopes, stamps, dateFilter, sortBy, itemSort, savedAt }`.

The fields mean the following:

- `items` is an array of parsed line items.
- `received` is a map of item key to count received.
- `envelopes` holds orphaned-mail records. Each record has the shape `{ id, createdAt, note, entries: [{ name, qty }], photos: [photoId], updatedAt }`.
- `stamps` is a map of **package** key to `{ kind, at, note, updatedAt }`. There is one stamp per package. The package key is built by `gkOf`, as `orderId::seller`. Never use `it.key` for it. `kind` is one of `claim | refunded | contacted | reshipped | partial | other`. `at` is the local calendar day the stamp was set.

**`kind: ""` is a tombstone.** It marks a removal. It is kept so that it can win a merge. Every reader goes through `hasStamp`, never key presence. Older saves have no `stamps`. `sanitizeStamps` defaults that field to `{}`, because `parseLedger` validates only `mailday` and `items`.

`updatedAt` on an envelope lets the two-device merge tell a real edit from a stale copy of the same envelope. It is optional and defaulted. An absent value reads as 0. So envelopes written before it shipped keep loading untouched. It costs nothing under the five-site rule below, because it lives *inside* `envelopes`, which is already persisted.

The item key is `orderId|itemNumber|vendorProductId`. It stays stable across re-imports. Never change how it is built. Envelope entries store card **names**, never item keys. So a re-import cannot rot them, and newly imported older orders become candidates for free.

New keys must be optional and defaulted in the load path, as `itemSort`, `envelopes` and `photos` are. Then saved states written by older builds keep loading. `itemSort` briefly shipped as `cardSort`. The load path still reads `cardSort` as a fallback.

Saved **versions** cost nothing here. That is by construction. `takeVersion` is a third *reader* of `snapshot()`, not a fourth builder. Every restore path funnels through `applyBackup`. Those paths are the file restore, the pull, the merge, and the History list. `stamps` is the proof. It shipped after the version list, and the version list needed no change. Give the list its own payload builder, and the next person to add a persisted key silently ships a rollback that drops it. Test 39.8b.

Adding a persisted key means touching **five** sites. They are the load effect; the save payload and its dep array; `backup`; the JSON restore branch; and `resetAll`. Miss any one of them, and a stale value silently survives a save or a merge, then gets pushed to the other device. Miss the last one, and the next debounced save writes the stale value straight back. Photo *blobs* are not in here at all. Only their ids are. See Envelope photos below.

The count stays **five**, not six. The download and the GitHub push share one payload builder, `snapshot()`. Give the push its own builder, and the next person to add a key misses one. The push carries no timestamp, for the same reason. The timestamp goes in the commit message instead. So the pushed bytes stay identical to what the Backup file has always contained.

**Plus one outside `app.jsx`.** `mergeLedger` in `merge-rules.mjs` builds the merged ledger from named fields. So a key that it does not name is dropped by every merge. The merge applies that result as a full replace, and it pushes the result. Both devices lose the key. `stamps` was the first key added after that builder existed. Test 37.62 pins the key's presence.

A related rollout hazard exists. An older build's `snapshot()` omits `stamps`. So its next push publishes a ledger without them. A Pull onto the new build then wipes them. A Merge keeps the local ones. Update both devices before stamping anything.

**Pinned by:** 9.1–9.3 (envelopes survive a reload), 37.48 (stamps survive a reload), 37.49 (a save from before stamps loads clean), 37.50 (Reset clears them), 37.51 (the pushed payload carries them), 37.62–37.63 (the merged ledger keeps the stamps key), 39.8b (a version holds the whole saved shape).

Mutants confirmed red:
- `mergeLedger` not naming `stamps` (37.62–37.68);
- `snapshot()` dropping `stamps` (25.10, 37.51, 37.68);
- `snapshot()` dropping `envelopes` (groups 25 to 27).

Test 37.62 asserts that `merged.stamps` deep-equals `{}`. Merely truthy is not enough. `undefined` is what the builder produces when it forgets the key.

