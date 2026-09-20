# List Photos Is Three Valued Too

A 404 from the photo repo means either nothing pushed yet, or a private repo the caller cannot see. GitHub answers both cases the same way. Reading that as simply empty would tell a keyless device that every photo it owns is lost. The photo list function answers with a known list or an explicit unknown reason instead. Planning code then refuses to compute lost or pending photos when the answer is unknown.

## The argument, as recorded

```
  - **`listPhotos()` is three-valued.** A 404 means "nothing pushed yet" on a
    repo you can see and "you can't see this repo" on a private one, because
    GitHub hides existence rather than admitting a 403 — verified live: a
    keyless request to the photo repo (then named `mailaudit-photos`, now
    `mailaudit-data`) 404s on both the tree *and* the repo itself. Collapse that to "empty" and a device with no key concludes every
    photo it owns is **lost**. So it answers `{known:true, ids}` or
    `{known:false, reason}`, `photoPlan` refuses to compute `lost` or `toPush`
    when it doesn't know, and a 404 is disambiguated by one extra
    `GET /repos/{owner}/{repo}`. Tests 26.13b, 30.13–30.15.
```

## See also

- `peek-is-three-valued` — the same rule applied to the ledger sha.
- `offline-is-decided-by-fetch` — the same rule read in the other direction.
- `photo-ids-unreadable-local` — the local half of the same three-valued shape.
