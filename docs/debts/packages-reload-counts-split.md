# A check-in during a Packages reload can revert its checkbox

**What.** `PackagesModel.load()` (through `build()`, `Packages.swift`) reads the counts once, at the reload's start (`got`). It sets `received`, `labels`, `done` and `gots` from that snapshot. Its rows re-filter against `store.received()` after the last await. A check-in that lands during the reload does its own reread. Then the reload lands and resets that line's checkbox to the old count (`PackagesView.swift`, the line checkbox). The save itself is kept. Each line costs one bundle call, so the window widens on a large ledger. The trigger is a Worker apply reload while the owner checks in. The gap closes when a reload that lands after a check-in keeps the check-in's counts, and a test pins a check-in during a gated reload.

**Status:** open. Restyle lane.

**Decision:** `ux-house-rules-govern`.
