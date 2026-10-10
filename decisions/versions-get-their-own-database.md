# Saved versions live in their own IndexedDB database

`window.versions` is a separate IndexedDB database. It is not another store bolted onto `mailday-photos`. Adding a store requires a version bump, and a failed upgrade takes the whole connection with it. Photos are irreplaceable and versions are a convenience. So the two must never be able to hurt each other.

The versions database has two object stores. `meta` is small, and it is read every time the History panel opens. `blobs` is large, and it is read only on an actual restore. Keep them apart. `getAll()` hands back whole records, so one store would load every saved ledger just to render a list of dates.

Snapshots are gzipped with `CompressionStream`. That is built into Safari, so it needs no dependency. ~235KB of ledger JSON becomes ~25KB. The measured figure is 65,756 → 5,680 bytes, a ratio of 11.6×. The compression figures live in `ledger-and-seed-sizes`. The `gz` flag rides in the metadata, so the app never assumes compression happened.

The ledger and the photos must also stay apart, for a different reason. The ledger is one small JSON blob that saves on a 500ms debounce. Photos are megabytes, and they must never get near it. localStorage caps out around 5MB. IndexedDB scales with free disk, and it stores Blobs without base64's ~33% inflation.

## See also

- `version-tiers-are-unioned` — the retention rule that decides what this database keeps
- `storage-split-three-adapters` — the split this database is one third of
- `single-file-architecture` — the platform layer file this database lives behind
