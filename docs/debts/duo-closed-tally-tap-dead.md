# A tap on Tally does nothing on the closed Duo

**What.** On the closed iPhone Duo, a tap on the system tab bar's Tally button does not select Tally. Ledger stays selected, with no change over 3 seconds and no hang. `DuoSpreadUITests.testClosedTallyIsOnePage` on the Duo branch passes at `682e73f` and fails at `50d1f4a`, the merge of the step 5 restyle. Reverting TallyView, LedgerTab or OrphanedView alone leaves it red, which points at `ControlViews.swift`. That is unproven: reverting ControlViews alone does not compile, and a cause spread across two files is not ruled out. The gap closes when a test on main fails on the old code and passes after the fix.

**Status:** open, 2026-10-28. A test-author is porting the test to main on branch `duo-tally-tap`.

**Decision:** `duo-card-in-hand`.
