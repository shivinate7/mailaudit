# Some labels are below the 10px floor

**What.** Some labels are smaller than the 10px floor today. The owner ruled on 2026-10-11 that no visible text is smaller than 10px. The gap closes when lane L1 lifts them and `check:screens` proves the floor.

**Status:** Fixed in code at d1706a3 (2026-10-11, red cases first at 9f3aa9a). Tests 61.29 to 61.32 in `test/app.test.mjs` assert no Tally, Packages, Orphaned or History label is under 10px. This debt has no Retire line, so a delete waits on a `Retire-run` cite.

**Decision:** `typography-cochin-and-mono`.
