# Nothing recovers without the key

**Status:** open.

A fresh device must have its token before it can recover, not after. This is the standing cost of the ledger being private. The move to a different repo did not change that cost. The repo is still one private repo, just a different one. Every unreachable state must read as "needs your key". It must never read as lost or absent. That is why `listPhotos` and `peek` are three-valued. It is also why `classifyLedger` disambiguates the 404.

**Holds while:** no keyless recovery path exists. An unauthenticated request to `repos/shivinate7/mailaudit-data` returns 404. `src/entry.jsx` sends the stored token as a Bearer header.

## See also

- `recovery-control-not-state-gated` — the pattern this fresh-device case follows
- `listphotos-is-three-valued` — one of the three-valued reads this thread names
- `peek-is-three-valued` — the other three-valued read this thread names
- `ledger-private-source-public` — the decision this cost is standing on
