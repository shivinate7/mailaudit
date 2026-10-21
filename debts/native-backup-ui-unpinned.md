# No UI test taps Backup

**What.** `MastheadBackupUITests` checks that the Backup row is a 44pt button and runs an accessibility audit on the Ledger tab. No UI test taps it, so none drives the share sheet. No launch argument corrupts the seed, so none runs Backup on a ledger that failed to open. `testRefusedLoadStillExportsTheFileAsItIs` pins that path in the model only. Whether the view reaches the store when the load throws is not pinned (`recovery-control-not-state-gated`). The gap closes when a UI test taps Backup on a good ledger and on a refused one.

**Status:** open.

**Decision:** `recovery-control-not-state-gated`.
