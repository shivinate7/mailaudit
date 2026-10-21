# Native lanes N6, N8 and N9 are not built

**What.** `native/` holds no Tally, backup or milestone view on main. Lanes N6 (Tally and filters), N8 (masthead and backup) and N9 (milestones) are planned rows in `native-build-lanes`. None has landed. Lane N7 (Orphaned) landed on branch `native/n7-orphaned`. The N5 UI test covers Packages only, so N6 also adds the Tally test. The gap closes when each lane lands with its tests.

**Status:** open. Batch 5 holds N6 and N8, after N5, with N4b and N9.

**Decision:** `native-build-lanes`.
