# Saved versions live in their own IndexedDB database

Saved versions do not share a database with photos. A schema change to one store means a version bump on the whole connection, and a failed upgrade takes everything down with it. Photos are irreplaceable and versions are only a convenience, so the two must never be able to harm each other. Inside the versions database, small metadata sits in one store, and large blobs sit in another. Reading a whole object store to render a list of dates would be wasteful. See measurements/ledger-and-seed-sizes for the compression figures.

## The argument, as recorded

```
`window.versions` is a **separate IndexedDB database**, not another store bolted
onto `mailday-photos`. Adding a store means a version bump, and an upgrade that
fails takes the whole connection with it — photos are irreplaceable and versions
are a convenience, so they must not be able to hurt each other. Inside it, two
object stores: `meta` is small and read every time the History panel opens,
`blobs` is large and read only on an actual restore. Keep them apart —
IndexedDB's `getAll()` hands back whole records, so a single store would
materialise every saved ledger just to render a list of dates. Snapshots are
gzipped with `CompressionStream` (built into Safari, no dependency; ~235KB of
ledger JSON becomes ~25KB — measured 65,756 → 5,680 bytes, 11.6×), and the `gz`
flag rides in the metadata rather than being assumed. Keep them apart: the ledger is one small
JSON blob that has to save on a 500ms debounce, and photos are megabytes that
must never get near it. localStorage caps out around 5MB; IndexedDB scales with
free disk and stores Blobs without base64's ~33% inflation.
```
