# listPhotos is three-valued too

`listPhotos()` answers in one of two shapes: `{known:true, ids}` or `{known:false, reason}`. A 404 is ambiguous. On a repo you can see, it means that nothing has been pushed yet. On a private repo you cannot see, it means that you cannot see the repo. GitHub hides existence rather than admitting a 403, so both cases look the same. Reading that as simply empty would tell a keyless device that every photo it owns is lost.

A keyless request to the photo repo 404s on both the tree and the repo itself. That was verified live. The photo repo was once named `mailaudit-photos`. It is now `mailaudit-data`. A 404 is disambiguated by one extra `GET /repos/{owner}/{repo}`.

`photoPlan` refuses to compute `lost` or `toPush` when the answer is unknown. Planning code therefore never reports photos as lost on a device that cannot see them.

Tests 26.13b and 30.13–30.15 pin this.

## See also

- `peek-is-three-valued` — the same rule applied to the ledger sha.
- `offline-is-decided-by-fetch` — the same rule read in the other direction.
- `photo-ids-unreadable-local` — the local half of the same three-valued shape.
