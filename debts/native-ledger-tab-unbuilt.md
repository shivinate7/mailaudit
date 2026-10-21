# The native Ledger tab holds the Backup row only

**What.** Lane N8 built the Backup row in the Data group of `native/Manifest/LedgerTab.swift`. No lane builds the rest of the options that `ledger-tab-holds-options` puts in the Ledger tab: the View group, the Sync and History rows, and Reset. The gap closes when a lane lands them in the native client.

**Status:** open. The owner names the lane.

**Decision:** `native-build-lanes`.
