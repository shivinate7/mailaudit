# The pull reports photos with no copy left

A pull names the photos that have no copy left on any device or on the Worker, after its fetch. The pull does not warn before it replaces the ledger (owner ruling 2026-10-15). Tests 30.18s and 30.18t pin that a photo the current ledger names survives the sync.

**Holds while:** `pullPhotos` in `src/app.jsx` names photos with no copy left after its fetch, from `plan.lost` in `photoPlan`, and test 30.10b pins it. `doMerge` calls `pullPhotos`, so that report reaches a merge too. Test 30.19 keeps a photo that both ledgers reference, and test 30.20 does not report that photo as gone.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-restore-keep-if-known`, the restore rule that keeps the ids a pull needs.
- `photo-sync-cannot-conflict`, why a photo id is never a shared write.
- `two-device-merge-proven-first`, the two-device check. A pull replaces the ledger. The merge unions line items and never drops one.
