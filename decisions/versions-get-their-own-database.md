# Saved versions live in their own IndexedDB database

Saved versions do not share a database with photos. A schema change to one store means a version bump on the whole connection, and a failed upgrade takes everything down with it. Photos are irreplaceable and versions are only a convenience, so the two must never be able to harm each other. Inside the versions database, small metadata sits in one store, and large blobs sit in another. Reading a whole object store to render a list of dates would be wasteful. The compression figures live in `ledger-and-seed-sizes`.

## See also

- `version-tiers-are-unioned` — the retention rule that decides what this database keeps
- `storage-split-three-adapters` — the split this database is one third of
- `single-file-architecture` — the platform layer file this database lives behind
