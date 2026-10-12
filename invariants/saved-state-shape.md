# Saved-state shape is fixed

The saved ledger has one named shape. Its fields are the ledger data and the view preferences: `{ items, received, receivedAt, envelopes, stamps, dateFilter, sortBy, itemSort, savedAt }`.

The fields mean the following:

- `items` is an array of parsed line items.
- `received` is a map of item key to count received.
- `receivedAt` is a map of item key to the time, in ms, of its last check or un-check. A key that is absent from `received` but has a time is an un-check. A merge keeps the later time per key. A side with no time for a key falls back to the per-key max, so older saves merge as before. It is optional and defaulted on load.
- `envelopes` holds orphaned-mail records. Each record has the shape `{ id, createdAt, note, entries: [{ name, qty }], photos: [photoId], updatedAt, deletedAt }`. `deletedAt` is optional. An absent value means that the record is live.
- `stamps` is a map of **package** key to `{ kind, at, note, updatedAt }`. There is one stamp per package. The package key is built by `gkOf`, as `orderId::seller`. Never use `it.key` for it. `kind` is one of `claim | refunded | contacted | reshipped | partial | other`. `at` is the local calendar day the stamp was set.

**`kind: ""` is a tombstone.** It marks a removal. It is kept so that it can win a merge. Every reader goes through `hasStamp`, never key presence. Older saves have no `stamps`. `sanitizeStamps` defaults that field to `{}`, because `parseLedger` validates only `mailday` and `items`.

**`deletedAt` is a tombstone.** A discard or an assign on an envelope sets `deletedAt`, and empties `entries` and `photos`. Every envelope reader skips a tombstone. It is kept so that it can win a merge, as the stamp tombstone does. The merge compares `updatedAt`, so a newer live edit beats an older tombstone.

`updatedAt` on an envelope lets the two-device merge tell a real edit from a stale copy of the same envelope. It is optional and defaulted. An absent value reads as 0. So envelopes written before it shipped keep loading untouched. It costs nothing under the five-site rule below, because it lives *inside* `envelopes`, which is already persisted.

The item key is `orderId|itemNumber|vendorProductId`. It stays stable across re-imports. Never change how it is built. Envelope entries store card **names**, never item keys. So a re-import cannot rot them, and newly imported older orders become candidates for free.

New keys must be optional and defaulted in the load path, as `itemSort`, `envelopes` and `photos` are. Then saved states written by older builds keep loading. `itemSort` briefly shipped as `cardSort`. The load path still reads `cardSort` as a fallback.

Saved **versions** cost nothing here. That is by construction. `takeVersion` is a third *reader* of `snapshot()`, not a fourth builder. Every restore path funnels through `applyBackup`. Those paths are the file restore, the pull, the merge, and the History list. `stamps` is the proof. It shipped after the version list, and the version list needed no change. Give the list its own payload builder, and the next person to add a persisted key silently ships a rollback that drops it. Test 39.8b.

Adding a persisted key means touching **five** sites. They are the load effect; the save payload and its dep array; `backup`; the JSON restore branch; and `resetAll`. Miss any one of them, and a stale value silently survives a save or a merge, then gets pushed to the other device. Miss the last one, and the next debounced save writes the stale value straight back. Photo *blobs* are not in here at all. Only their ids are. See Envelope photos below.

The count stays **five**, not six. The download and the GitHub push share one payload builder, `snapshot()`. Give the push its own builder, and the next person to add a key misses one. The push carries no timestamp, for the same reason. The timestamp goes in the commit message instead. So the pushed bytes stay identical to what the Backup file has always contained.

**One device-local field.** `workerSyncedAt` (when the Worker last agreed) rides the save payload and the load effect only. It is not in `snapshot()`, `backup`, the restore branches or the merge, because it describes this device and not the ledger. It is optional and defaulted on load.

**Plus one outside `app.jsx`.** `mergeLedger` in `merge-rules.mjs` builds the merged ledger from named fields. So a key that it does not name is dropped by every merge. The merge applies that result as a full replace, and it pushes the result. Both devices lose the key. `stamps` was the first key added after that builder existed. Test 37.62 pins the key's presence. `receivedAt` is named there too, and group 49 pins it.

A related rollout hazard exists. An older build's `snapshot()` omits `stamps`. So its next push publishes a ledger without them. A pull onto the new build then wipes them. A merge keeps the local ones. Update both devices before stamping anything.

A second rollout hazard exists for stage 4a. An old build shows a tombstone as an empty envelope. Its push drops `receivedAt`, so an un-check can come back. Update both devices before you un-check or discard anything.

**Pinned by:** 9.1–9.3 (envelopes survive a reload), 37.48 (stamps survive a reload), 37.49 (a save from before stamps loads clean), 37.50 (Reset clears them), 37.51 (the pushed payload carries them), 37.62–37.63 (the merged ledger keeps the stamps key), 39.8 and 39.8b (a version holds the whole saved shape, and a version built from its own payload rather than `snapshot()` fails both), group 49 (un-checks and deletes travel between devices). The web salvage and fallbacks: group 67 (the load, Re-import and sync reply cases; 67.F1 to 67.F3; 67.7).

Mutants confirmed red:
- `mergeLedger` not naming `stamps` (37.62–37.68);
- `snapshot()` dropping `stamps` (25.10, 37.51, 37.68);
- `snapshot()` dropping `envelopes` (groups 25 to 27).

Test 37.62 asserts that `merged.stamps` deep-equals `{}`. Merely truthy is not enough. `undefined` is what the builder produces when it forgets the key.

## A damaged list is kept, mended and told

Owner ruling 2026-10-12 ("Keep a copy, then go on"), home `native-ledger-is-raw-json`. A `received`, `receivedAt`, `stamps` or `envelopes` value of the wrong shape is damage, whole field or single entry. JSON `null` is damaged. An absent field is not. The right shapes: numbers in `received` and `receivedAt`, objects in `stamps`, objects with a string `id` in `envelopes`.

On every path data comes in (load, Re-import, a sync reply, a pull), the client does three things:

- It saves the data as it came in to History as a milestone, and waits for the write. On native the copy is a kept file beside ledger.json instead, see `native-ledger-is-raw-json`. If the write fails, nothing changes: a load refuses, a restore, pull or merge throws, and a sync reply counts as a failed call.
- It keeps every entry it can read. `salvageLedger` in `view-rules.mjs` does this. It is the only mender. Its callers are the load effect, `readLedger` (restore, pull, merge), `settleReply` (sync reply) and the native load. The Worker calls it twice: to refuse a POST with a bad shape, and to mend a stored ledger before the merge (Worker 68.1 to 68.3). `rules.js` carries it for Swift, which calls it from the native load.
- It shows one line: "N entries could not be read; the original is in History." A dropped whole field counts 1, and each dropped entry counts 1.

The Worker refuses a POST with a bad shape (400), so one app's bug cannot reach the other.

**Closed at `c48fc20`: the Worker keeps every mended original.** Before any write, the Worker copies the damaged stored ledger to `kept`, whatever the snapshots hold. The copy is written even when today's snapshot exists. Pinned by 69.1 (group 69).

**What PR #87 guards, each with its pins:**

1. A restore copies the refused text to History first and waits. If the copy fails, it changes nothing. Pinned by 68.1, 68.1a to 68.1c.
2. A re-import whose copy cannot be saved says so, and does not say "not a backup". Pinned by 68.2, 68.2a, 68.2b.
3. Saved text that is valid JSON but not an object is refused. Pinned by 68.3.
4. The Worker mends a damaged stored ledger before the merge. Pinned by Worker 68.1 to 68.3.
5. A Worker 400 is its own sync status, `bad-shape`. It is not retried on backoff. The next change POSTs again. It shows one plain line. Pinned by 68.4, 68.5, 68.5a, 68.5b.
6. A damaged sync reply whose copy cannot be saved is not applied. It counts as a failed call (`code` `unknown`), and no send waits for the copy. The check-in POSTs while the copy is missing (68.6b), and so does a GitHub mirror conflict (68.9). `sendPost` has no hold. It is the one call to `window.sync.post`, and it has two callers: `postRef` and the mirror-conflict path. The retry is a POST after backoff, not a GET. That POST makes the Worker mend its stored ledger and keep the damaged original in `kept` before it writes. The Worker's clean reply then applies (68.6a). Pinned by 68.6pre, 68.6, 68.6a, 68.6b, 68.9pre, 68.9, 68.10pre, 68.10a, 68.10bpre and 68.10b, in `test/app.test.mjs` (`npm test`). The Worker half is group 69 (69.1 to 69.6) and 68.1 to 68.3, in `worker/core.test.mjs` (`npm run test:worker`).
7. A Worker 400 (`bad-shape`) shows one line, and the line offers no fix: "The sync server refused this ledger’s shape, so it is not backed up." Pinned by 68.5b.
8. A History restore and a branch restore whose copy cannot be saved show the Re-import copy-failed line, not "looks corrupt", and change nothing. Pinned by 68.7pre, 68.7, 68.7a, 68.7b, 68.8pre, 68.8, 68.8a, 68.8b.
9. No client path holds sends: a GitHub mirror conflict POSTs to the Worker even while a local copy is missing. Pinned by 68.9pre and 68.9.

**Orchestrator defaults 2026-10-12, not owner rulings.** These fallbacks refuse and change nothing. They apply when the copy cannot be written, or the saved text is not JSON, or it is JSON that is not an object (`null`, a number, a list).

- Load: the page says the saved ledger is damaged and was not loaded. It keeps the raw text and offers History and Backup. While refused, nothing is sent: no sync call or apply, no CSV import, no push. Reset puts the raw text in History first, or does not reset.
- A restore, from a file or from History, clears the refusal. It copies the refused text to History first and waits for the write. If the copy fails, the restore throws and changes nothing. A History restore whose copy fails shows the Re-import copy-failed line below, not "looks corrupt".
- Re-import: when the copy cannot be saved, the page shows "A copy of that file could not be saved to History, so nothing was changed." This happens when the versions store is missing or a write fails. Any other failure shows `That file isn’t a Mail Day backup.`
- Sync reply: a reply with unreadable entries is copied to History first. If the copy fails, the reply counts as a failed call and nothing is applied. Sends go on (item 6). The retry is a POST after backoff.

**Pinned by (web):** group 67 (the 67 labels for load, Re-import and sync reply; 67.F1 to 67.F3; 67.7 and 67.7a). 67.F1b, 67.F1c, 67.F2b and 67.F2c check that no push starts. Worker: 67.1 and 67.2, run by `npm run test:worker`, not `npm test`. Items 1 to 9 above: tests 68.1 to 68.10b, in `test/app.test.mjs`, run by `npm test`. Worker: group 69 (69.1 to 69.6) and 68.1 to 68.3, run by `npm run test:worker`.

**Read from code, not tested:** the pull and merge fallbacks, and the sync and apply guards. Reset with the raw text, and the CSV block.
