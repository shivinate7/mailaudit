# A pull names no photo as lost

A pull does not report any photo as lost. The Worker lacking a blob does not mean no device holds it, because the device that took the photo may still be uploading. The pull does not warn before it replaces the ledger (owner ruling 2026-10-15). Tests 30.18s and 30.18t pin that a photo the current ledger names survives the sync. The app names no lost photo, see debt `unheld-photo-never-reported`.

**Holds while:** `pullPhotos` in `src/app.jsx` names no photo as lost. Its messages are the "more will arrive on the next sync" line and the photo-store and server advisories. `photoPlan` in `src/photo-rules.mjs` still returns `lost`, and nothing in `src/` reads it. Test 31.15 reads that `lost` list. Test 30.10b pins that no "no copy left" wording and no GitHub word shows for a photo the Worker lacks. Test 30.20 pins that a photo both ledgers reference is not reported gone. `doMerge` calls `pullPhotos`, so the same holds for a merge. Test 30.19 keeps a photo that both ledgers reference.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-restore-keep-if-known`, the restore rule that drops ids this device does not hold.
- `photo-sync-cannot-conflict`, why a photo id is never a shared write.
- `two-device-merge-proven-first`, the two-device check. A pull replaces the ledger. The merge unions line items and never drops one.
