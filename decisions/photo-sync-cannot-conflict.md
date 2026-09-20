# Photo sync cannot conflict by design

Photo sync works as a set difference over immutable, id-addressed files. Each remote path gets written exactly once, by whichever device holds it. Nothing ever merges or overwrites another device's copy this way. This is why one file per photo won out over a mutable manifest. It also beat the Git Data API, since both needed their own conflict machinery.

## The argument, as recorded

```
  The whole algorithm is a **set difference over ids**. A photo file is
  immutable and addressed by its id, so every remote path is written exactly
  once by whoever holds it: nothing merges, nothing overwrites, there is no
  second sha to track, and **photo sync cannot conflict by construction**. That
  property is why one-file-per-photo beat both a manifest (mutable, needs its
  own sha machinery, can drift from the directory, saves zero requests) and the
  Git Data API (one tidy commit, but a ref update needs a parent sha, so two
  devices backing up at once would genuinely collide). Protect it.
```

## See also

- `photo-errors-never-reach-pushstate` — the consequence of this design for error handling.
- `photos-stay-out-of-the-ledger` — the boundary that keeps photo ids simple to diff.
