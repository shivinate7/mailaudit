# The Ledger tab may jump at cold launch

**What.** At launch the app sets the masthead only after boot (`native/Manifest/ManifestApp.swift`). Until then the Ledger tab, the opening tab, draws with no masthead (`native/Manifest/LedgerTab.swift`), then moves down by the masthead plus the 47pt running-head slot. A tap on Reset or Backup in that first moment can land on a different row, against invariant `no-layout-shift-under-pointer`. Step 5 review round 3 found it by reading. The shift is unmeasured, and no test drives it. The gap closes when the masthead's space is held from the first frame, or a measurement shows the bare frame never draws. It also needs a UI test that pins the Ledger rows' positions across boot.

**Status:** open. Step 5 merges with it open.

**Decision:** `masthead-running-head-sticky`.
