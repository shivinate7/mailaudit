# listPhotos is three-valued too

A 404 from the photo repo means either nothing pushed yet, or a private repo the caller cannot see. GitHub answers both cases the same way. Reading that as simply empty would tell a keyless device that every photo it owns is lost. The photo list function answers with a known list or an explicit unknown reason instead. Planning code then refuses to compute lost or pending photos when the answer is unknown.

## See also

- `peek-is-three-valued` — the same rule applied to the ledger sha.
- `offline-is-decided-by-fetch` — the same rule read in the other direction.
- `photo-ids-unreadable-local` — the local half of the same three-valued shape.
