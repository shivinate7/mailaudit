# Nothing recovers without the key

**Status:** open.

A fresh device must be set up with a token before it can recover anything, not after. This is the standing cost of the ledger repo being private. The move to a new private repo left this cost unchanged. Every unreachable state has to read as needing a key, never as lost or absent. That is why `listPhotos`, `peek`, and `classifyLedger` all disambiguate a hidden repo from an empty one.

## The thread, as recorded

```
- **Nothing recovers without the key.** A fresh device must be set up before it
  can recover rather than after — the standing cost of the ledger being private,
  and unchanged by the move (it is still one private repo, just a different one). Everything unreachable must read as *"needs your key"* and never as
  lost or as absent, which is why `listPhotos` and `peek` are three-valued and
  why `classifyLedger` disambiguates the 404.
```

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the pattern this fresh-device case follows
- `listphotos-is-three-valued` — one of the three-valued reads this thread names
- `peek-is-three-valued` — the other three-valued read this thread names
- `the-ledger-repo-is-private-and-the-source-is-public` — the decision this cost is standing on
