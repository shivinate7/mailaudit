# Backup files restore with or without photos

A local backup downloads one JSON file. A second form adds the photos. The file picker restores either form.

**Holds while:** `snapshot()` in `src/app.jsx` returns `mailday`, `items`, `received`, `envelopes`, `stamps`, `dateFilter`, `sortBy` and `itemSort`.

Backup downloads the payload from `snapshot()`. An older backup holds `{mailday:1, items, received, envelopes, dateFilter, sortBy, itemSort}`. It has no `stamps`. The picker still restores it, and `stamps` starts empty.

A backup is small and quick, and it holds the irreplaceable part. Backup + photos appears only when photos exist. It adds `photos` as an `{id: dataURL}` map. Photos are memory aids, so their file size is opt-in.

The file picker sends a `.json` file to restore. It sends a `.csv` file to import. A restore is a full replace.

The replaced-envelopes warning is covered in `every-restore-passes-applybackup`.

## See also

- `saved-state-shape` — the keys a saved state holds.
- `every-restore-passes-applybackup` — the one function every restore passes through.
- `history-restores-a-saved-version` — the saved versions that the same panel restores.
- `photo-ids-restore-keep-if-known` — which photo ids a restore keeps.
- `csv-import-shows-a-summary` — what a `.csv` file does instead.
