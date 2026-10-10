# listPhotos is three-valued too

`listPhotos()` answers in one of two shapes: `{known:true, ids}` or `{known:false, reason}`. A 404 is ambiguous. On a repo you can see, it means that nothing has been pushed yet. On a private repo you cannot see, it means that you cannot see the repo. GitHub hides existence rather than admitting a 403, so both cases look the same. Reading that as simply empty would tell a keyless device that every photo it owns is lost.

**Holds while:** `listPhotos` in `src/entry.jsx` answers `{known: true, ids}` or `{known: false, reason}`, and `photoPlan` in `src/photo-rules.mjs` sets `lost` and `toPush` to `[]` when `known` is false.

A keyless request to the photo repo 404s on both the tree and the repo itself. That was verified live. The photo repo was once named `mailaudit-photos`. It is now `mailaudit-data`. A 404 is disambiguated by one extra `GET /repos/{owner}/{repo}`.

`photoPlan` refuses to compute `lost` or `toPush` when the answer is unknown. Planning code therefore never reports photos as lost on a device that cannot see them.

Tests 26.13b and 30.13–30.15 pin this.

**Pinned by:** 26.13b and 30.13–30.15. The harness photo mock refuses to answer without a key. The photo repo is private. GitHub hides a private repo behind a 404. A keyless mock would make the suite blind to the whole `no-access` class of bug. That blindness forced test 26.13 to split.

## See also

- `peek-is-three-valued` — the same rule applied to the ledger sha.
- `offline-is-decided-by-fetch` — the same rule read in the other direction.
- `photo-ids-unreadable-local` — the local half of the same three-valued shape.
