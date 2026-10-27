# The ledger remote is not needed for a build

Kind: build

Plan: docs/decisions/ledger-remote-needed-for-seed.md#retired (web)

**Status:** retired 2026-10-14 with `the-public-seed`. The build reads no seed, so it needs no `ledger` remote and no data branch.

**Holds while:** `build.mjs` runs no git command (line 11 says it needs neither git nor a ledger remote), and the `deploy` script in `package.json` starts with `npm run build`, not a fetch.

## Retired

Nothing here applies. The deploy guard that stopped on a failed `git fetch ledger data` is gone with the fetch.

## See also

- `the-public-seed` — the removal this retirement follows
- `data-branch-setup` — the data branch, which no build reads now
