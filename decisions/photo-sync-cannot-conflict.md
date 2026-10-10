# Photo sync cannot conflict by design

Photo sync works as a set difference over immutable, id-addressed files. Each remote path gets written exactly once, by whichever device holds it. Nothing ever merges or overwrites another device's copy this way. This is why one file per photo won out over a mutable manifest. It also beat the Git Data API, since both needed their own conflict machinery.

## See also

- `photo-errors-never-reach-pushstate` — the consequence of this design for error handling.
- `photos-stay-out-of-the-ledger` — the boundary that keeps photo ids simple to diff.
