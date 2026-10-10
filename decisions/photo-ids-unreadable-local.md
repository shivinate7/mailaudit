# An unreadable local photo store keeps ids

An unreadable local photo store keeps every id, exactly as an unreadable remote one does. When the store cannot answer, silence is not a fact. The app must not treat it as an empty store.

Never write `photos.keys().catch(() => [])`. That pattern reads "I could not look" as "this device holds nothing". With IndexedDB unavailable, every id not already on the photo remote was stripped. The debounced save then wrote the stripped ledger, and the next push published it.

`applyBackup` keeps every id when the store will not answer. `surveyPhotos` returns `null` rather than planning a sync it cannot survey honestly. The remote half of this rule is pinned by test 26.13b.

## See also

- `photo-ids-restore-keep-when-known` — the remote half of the same rule.
- `listphotos-is-three-valued` — the same three-valued reasoning applied locally.
