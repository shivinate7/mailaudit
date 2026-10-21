# Native lanes N6, N7 and N9 are not built

**What.** `native/` holds no Tally, Orphaned or milestone view on main. Lanes N6 (Tally and filters), N7 (Orphaned) and N9 (milestones) are planned rows in `native-build-lanes`. None has landed. Lane N8 (masthead and backup) landed on branch `native/n8-masthead`. The N5 UI test covers Packages only, so N6 and N7 also add the Tally and Orphaned tests. The gap closes when each lane lands with its tests.

**Status:** open. Batch 5 holds N6 and N7, after N5, with N4b and N9.

**Decision:** `native-build-lanes`.
