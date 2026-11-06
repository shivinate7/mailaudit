# A fresh device needs its device key to recover

**Status:** open.

A fresh device must have its device key before it can recover, not after. The Worker's snapshot routes need that key. A Cloudflare Access email code is a backup way in, and it is untested (`cloudflare-access-login-untested`). Every unreachable state must read as "needs your key". It must never read as lost or absent. That is why `listPhotos` and `peek` are three-valued. It is also why `classifyLedger` disambiguates the 404.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md

**Holds while:** the Worker's snapshot routes need a device key (`worker-keeps-snapshots`). An unauthenticated request to `repos/shivinate7/mailaudit-data` returns 404. `src/entry.jsx` sends a stored GitHub token as a Bearer header if one is present.

## See also

- `recovery-control-not-state-gated` — the pattern this fresh-device case follows
- `listphotos-is-three-valued` — one of the three-valued reads this thread names
- `peek-is-three-valued` — the other three-valued read this thread names
- `ledger-private-source-public` — the decision this cost is standing on
