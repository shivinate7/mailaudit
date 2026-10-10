# peek is three-valued, not a guess

The peek check reads only the remote's blob sha, a few hundred bytes, not the full ledger. It answers with one of three states. "Could not look" must never read as "all clear". Reading an unknown state as clear is the one state in which a push would overwrite the other device.

`peek()` calls `GET /git/trees/{branch}`. That returns the **blob** sha for `ledger.json`. It is the exact value `push` stores, and `rec().sha` is compared against it. The call spends a few hundred bytes of the read budget. A Contents GET would spend ~470KB to answer the same question.

`peek()` runs on foreground, never on a timer. It is three-valued for the same reason `listPhotos` is.

Auto-push is unconditional. There is no toggle. It looks before every write, and it declines on `ahead` or on unknown. If a conflict opens between the look and the write, it resolves by merging. It does not leave `Push anyway` armed on a screen nobody is watching.

## See also

- `listphotos-is-three-valued` — the same rule applied to photos.
- `offline-is-decided-by-fetch` — the same rule read in the other direction.
- `sha-accepted-only-after-apply` — the sha this read compares against.
- `ruled-head-the-elapsed-time-is-handed-forward` — the resume signal this read consumes.
