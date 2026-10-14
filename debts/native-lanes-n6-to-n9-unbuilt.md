# Native lanes N6 to N9 are not built

Lanes N6 (Tally and filters), N7 (Orphaned), N8 (masthead and backup) and N9 (milestones) are planned rows in `native-build-lanes`. None has landed. `native/` holds no Tally, Orphaned, backup or milestone view on main. The N5 UI test covers Packages only, so N6 and N7 also add the Tally and Orphaned tests. The gap closes when each lane lands with its tests.

**Status:** open. Batch 5 holds N6, N7 and N8, after N5, with N4b and N9.

**Decision:** `native-build-lanes`.
