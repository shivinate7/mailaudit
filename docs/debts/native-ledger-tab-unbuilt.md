# The native Ledger tab lacks the View group

**What.** The native Ledger tab holds the Sync row and panel, the History row, the Backup row and the Reset box, in `native/Manifest/LedgerTab.swift`. No lane builds the View group that `ledger-tab-holds-options` puts in the Ledger tab: Showing, Sorted by and Orders from. Native keeps those controls on the Tally screen until a lane builds the group. Re-import CSV stays on the web (`csv-import-stays-web`). The open History version row also lacks the web's detail line, "N lines, M checked in — K against now." The gap closes when a lane lands the View group and the detail line.

**Status:** open. The owner names the lane.

**Decision:** `native-build-lanes`.
