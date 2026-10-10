# peek is three-valued, not a guess

The peek check reads only the remote's blob sha, a few hundred bytes, instead of the full ledger. It answers with one of three states, because could not look must never read as all clear. Reading an unknown state as clear is exactly the state where a push would overwrite the other device. Auto-push checks peek before every write and declines on an ahead or unknown result.

## See also

- `listphotos-is-three-valued` — the same rule applied to photos.
- `offline-is-decided-by-fetch` — the same rule read in the other direction.
- `sha-accepted-only-after-apply` — the sha this read compares against.
- `ruled-head-the-elapsed-time-is-handed-forward` — the resume signal this read consumes.
