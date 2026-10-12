# A merge fetches photos before it applies

A merge fetches the photos first, and then it applies the ledger. The pull inside a merge follows the same order. The Pull control that used to call this path left the UI on 2026-10-12.

**Holds while:** `doMerge` in `src/app.jsx` calls `pullPhotos` before `applyBackup`.

The ordering is what makes this feature work. `photo-ids-restore-keep-if-known` says which ids a restore keeps. If the ledger applied first, every id whose blob is not already on this device would be stripped, including ids the photo remote holds.

The merge has a sharper reason. The merge unions both devices' envelopes. Ids that arrive from the other device have no blob on this device yet. `applyBackup` would strip every one of them. So the photos come first.

**Pinned by:** 30.5–30.9 pin the merge's order. Mutant confirmed red: a merge that applies the backup before it downloads, which strips every id.

## See also

- `photo-ids-restore-keep-if-known` — the rule that keeps a photo id on restore.
- `merge-later-change-wins` — the merge that unions the envelopes.
- `merge-carries-no-two-tap-arm` — the merge's entrances.
- `every-restore-passes-applybackup` — the function this order protects.
