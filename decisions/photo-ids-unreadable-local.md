# An unreadable local photo store keeps ids

An unreadable local photo store keeps every id, exactly as an unreadable remote one does. When the store cannot answer, silence is not a fact. The app must not treat it as an empty store.

**Holds while:** `applyBackup` in `src/app.jsx` sets its local id list to null when `window.photos.keys()` throws, and then keeps every id. `surveyPhotos` returns `{ unreadable: true }` when that call throws.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

A failed `photos.keys()` must not read as an empty list. `applyBackup` and `surveyPhotos` both used `photos.keys().catch(() => [])`, which reads "I could not look" as "this device holds nothing". With IndexedDB unavailable, every id not already on the photo remote was stripped. The debounced save then wrote the stripped ledger, and the next push published it.

`applyBackup` keeps every id when the store will not answer. `surveyPhotos` returns `{ unreadable: true }` rather than planning a sync it cannot survey honestly. The push and the pull both stop there. When the store answers, a restore drops the ids it does not hold, see `photo-ids-restore-keep-if-known`. The remote half of this rule is pinned by test 26.13b.

Mutant confirmed red: an unreadable store read as empty.

**Pinned by:** 47.1 and 47.2 pin a file restore with the local store unreadable, on screen and in the saved ledger. Test 26.13b pins the remote half. For the `surveyPhotos` half, 47.6 kills a pull that reads the store as empty, and 47.5 kills a push that reads it as full. A push that meets an unreadable store says that the photos could not be read. So 48.1 to 48.3 catch a push that reads the store as empty.

## See also

- `photo-ids-restore-keep-if-known` — the restore rule, which keeps an id only when this device holds it.
- `listphotos-is-three-valued` — the same three-valued reasoning applied locally.
