# Photo sync cannot conflict by design

Photo sync is a set difference over ids. A photo file is immutable, and it is addressed by its id. So each remote path is written exactly once, by whichever device holds the photo. Nothing merges, and nothing overwrites. There is no second sha to track. Photo sync cannot conflict by construction.

**Holds while:** `photoName` in `src/photo-rules.mjs` names each file by its id. `photoPlan` works on ids only, with no sha input.

That property is why one file per photo won. A mutable manifest needs its own sha machinery. It can drift from the directory, and it saves zero requests. The Git Data API makes one tidy commit. But a ref update needs a parent sha. So two devices backing up at once would really collide. Protect this property.

Mutant confirmed red: a push that does not subtract what is already on the remote.

## See also

- `photo-errors-never-hit-pushstate` — how this design changes error handling.
- `photos-stay-out-of-the-ledger` — the boundary that keeps photo ids simple to diff.
