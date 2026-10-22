# Native lanes N7 to N9 are not built

**What.** `native/` holds no Orphaned, backup or milestone view on main. Lanes N7 (Orphaned), N8 (masthead and backup) and N9 (milestones) are planned rows in `native-build-lanes`. None has landed. The N5 and N6 UI tests cover Packages and Tally only, so N7 also adds the Orphaned tests. The gap closes when each lane lands with its tests.

**Status:** open. Batch 5 holds N7 and N8, after N5, with N4b and N9.

**Decision:** `native-build-lanes`.
