# A pull fetches photos before it applies

A pull fetches the photos first, and then it applies the ledger. The merge follows the same order.

**Holds while:** `doPull` in `src/app.jsx` calls `pullPhotos` before `applyBackup`.

The ordering is what makes this feature work. `applyBackup` keeps a photo id only when its blob is present. If the ledger applied first, every photo id would be stripped. Tests 30.5–30.9 pin the pull's order.

The merge has a sharper reason. The merge unions both devices' envelopes. Ids that arrive from the other device have no blob on this device yet. `applyBackup` would strip every one of them. So the photos come first.

## See also

- `photo-ids-restore-keep-if-known` — the rule that keeps a photo id on restore.
- `merge-rules-only-add` — the merge that unions the envelopes.
- `merge-carries-no-two-tap-arm` — the merge's two entrances.
- `every-restore-passes-applybackup` — the function this order protects.
