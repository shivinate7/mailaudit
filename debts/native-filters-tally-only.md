# The native client has no date filter, package sort or Packages search

**What.** Lane N6 built search, hide-received and the six sort keys on the Tally view only. `PackagesView` has no search and no hide-received, and `PackagesModel` sorts with the fixed key "newest". Neither native view has a date filter. The web has all of these on its ledger views. Native Packages also drops refunded packages, as the web's default view does, and has no stamped filter to bring them back (`stamped-filter-on-the-pipeline`). The gap closes when a lane builds them, and a test pins each one.

**Status:** open. No lane is briefed.

**Decision:** `native-parity-table`.

**Decision:** `date-filter-spans-ledger-views`.

**Decision:** `package-sort-swaps-with-view`.
