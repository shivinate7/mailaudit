# CI never runs the claim 8 test

CI never runs `npm run test:check-records`. The CI workflow runs `npm run check:records`, which checks the corpus, but no step runs the test of the claim 8 checker. So a claim 8 regression in `check-records.mjs` stays green in CI. When the test workflow runs `npm run test:check-records`, the gap closes.

**Status:** open.

**Decision:** `debts-hold-known-gaps`.
