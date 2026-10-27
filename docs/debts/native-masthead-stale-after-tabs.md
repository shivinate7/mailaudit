# The native masthead and Packages go stale after another tab writes

**What.** `MastheadModel.refresh()` now runs at boot, after a check-in on Packages or Tally, after each Orphaned write and after a Ledger reset or restore. `PackagesModel` reloads at boot, after its own check-in and after an Orphaned write (the `onChange` of the Orphaned tab in `RootView.swift`). A Tally check-in does not reload Packages, so the Packages rows read old data until the next Packages check-in or a restart. The web views read one check-in state (`three-views-share-one-switch`). The gap closes when every write that moves a check-in reloads `PackagesModel`, and a test pins each write path. `MastheadModelTests` pins the masthead side.

**Status:** open.

**Decision:** `native-parity-table`.
