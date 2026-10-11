# An unreadable local photo store keeps ids

An unreadable local photo store keeps every id, exactly as an unreadable remote one does. When the store cannot answer, silence is not a fact. The app must not treat it as an empty store.

**Holds while:** `applyBackup` in `src/app.jsx` sets its local id list to null when `window.photos.keys()` throws, and then keeps every id. Test 26.13b pins the remote half. The `surveyPhotos` half is unpinned: no test makes the local store unreadable during a photo sync.

`applyBackup` and `surveyPhotos` both used `photos.keys().catch(() => [])`, which reads "I could not look" as "this device holds nothing". With IndexedDB unavailable, every id not already on the photo remote was stripped. The debounced save then wrote the stripped ledger, and the next push published it.

`applyBackup` keeps every id when the store will not answer. `surveyPhotos` returns `null` rather than planning a sync it cannot survey honestly. The remote half of this rule is pinned by test 26.13b.

Mutant confirmed red: an unreadable store read as empty.

**Pinned by:** 47.1 and 47.2 pin a file restore with the local store unreadable, on screen and in the saved ledger. Test 26.13b pins the remote half. The `surveyPhotos` half is unpinned: no test makes the local store unreadable during a photo sync.

## See also

- `photo-ids-restore-keep-if-known` — the remote half of the same rule.
- `listphotos-is-three-valued` — the same three-valued reasoning applied locally.
