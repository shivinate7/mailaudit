# A green suite can hide a broken feature

A fully passing suite proved nothing about the single most important scenario, because every test booted a ledger that already held data. The Pull control turned out to be unreachable on an empty ledger, the exact case a fresh device needs it for. A green run only covers the states its fixtures actually build.

## See also

- `testing-an-assertion-that-cannot-fail-is-decoration` — the related failure mode of a test that proves nothing
- `testing-when-a-mutant-survives-find-the-unreached-state` — the same blind spot, found through a mutant instead
