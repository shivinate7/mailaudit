# The native masthead and Packages go stale after another tab writes

**What.** `MastheadModel.refresh()` runs at boot and after a Packages check-in, in `finished`. `PackagesModel` reloads at boot, after its own check-in and after an Orphaned write (the `onChange` of the Orphaned tab in `RootView.swift`). A Tally check-in refreshes neither. An Orphaned assign refreshes Packages and leaves the masthead stale. The masthead figures and the Packages rows then read old data until the next Packages check-in or a restart. The web views read one check-in state (`three-views-share-one-switch`). The gap closes when every write that moves a check-in refreshes the masthead and `PackagesModel`, and a test pins each write path.

**Status:** open.

**Decision:** `native-parity-table`.
