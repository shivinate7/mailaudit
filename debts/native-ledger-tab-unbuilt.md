# The native Ledger tab lacks the View and Sync groups

**What.** The native Ledger tab holds the Backup row (lane N8), and the History row and the Reset box (lane N9), in `native/Manifest/LedgerTab.swift`. No lane builds the rest of the options that `ledger-tab-holds-options` puts in the Ledger tab: the View group and the Sync row. Re-import CSV stays on the web (`csv-import-stays-web`). The gap closes when a lane lands the View group and the Sync row in the native client.

**Status:** open. The owner names the lane.

**Decision:** `native-build-lanes`.
