# The claim 8 branch for a Decision with no record has no test

The branch in `check-records.mjs` that reports a Decision line naming no record and not saying "none" has no test. When a test feeds the checker such a Decision line and sees it go red, the gap closes.

**Status:** open.

**Decision:** `debts-hold-known-gaps`.
