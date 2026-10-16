# A merge fetches photos before it applies

A held Worker reply fetches the photos it names before it applies the ledger. A merge does the same. The pull inside a merge follows the same order. The Pull control that used to call this path left the UI on 2026-10-12.

**Holds while:** `doMerge` in `src/app.jsx` calls `pullPhotos` before `applyBackup`.

The ordering is what makes this feature work. `photo-ids-restore-keep-if-known` says which ids a restore keeps. If the ledger applied first, every id whose blob is not already on this device would be stripped, including ids the photo remote holds. The ids the Worker holds are kept even when a download fails, so a retry beats a lost link.

The merge has a sharper reason. The merge unions both devices' envelopes. Ids that arrive from the other device have no blob on this device yet. `applyBackup` would strip every one of them. So the photos come first.

**Pinned by:** 30.5–30.9 pin the merge's order. Mutant confirmed red: a merge that applies the backup before it downloads, which strips every id.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-restore-keep-if-known` — the rule that keeps a photo id on restore only when this device holds it.
- `merge-later-change-wins` — the merge that unions the envelopes.
- `merge-carries-no-two-tap-arm` — the merge's entrances.
- `every-restore-passes-applybackup` — the function this order protects.
