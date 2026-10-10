# A green suite can hide a broken feature

A fully passing suite proved nothing about the single most important scenario. Every test booted a ledger that already held data. The Pull control was unreachable on an empty ledger. That is the exact case a fresh device needs it for.

**Holds while:** test 28.1 in `test/app.test.mjs` checks that the repair kit is reachable on an empty ledger.

Group 28 now pins this bug. A live check of the deployed page found it. The suite was all green, and the feature was still broken in its most important scenario. A green run covers only the states its fixtures actually build.

## See also

- `testing-an-assertion-that-cannot-fail-is-decoration` — the related failure mode of a test that proves nothing
- `testing-when-a-mutant-survives-find-the-unreached-state` — the same blind spot, found through a mutant instead
