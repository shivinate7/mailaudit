# The native Ledger tab lacks the View and Sync groups

**What.** The native Ledger tab holds the Backup row (lane N8), and the History row and the Reset box (lane N9), in `native/Manifest/LedgerTab.swift`. No lane builds the rest of the options that `ledger-tab-holds-options` puts in the Ledger tab: the View group and the Sync row. Re-import CSV stays on the web (`csv-import-stays-web`). The sync advisory line has no tap target to the Sync row, so it lacks the web's " — tap to fix". The gap closes when a lane lands the View group, the Sync row and the tap target in the native client.

**Status:** open. The owner names the lane.

**Decision:** `native-build-lanes`.
