# The pinned-head audit flags Dynamic Type on one card

**What.** `MastheadBackupUITests.testAccessibilityAuditWithTheRunningHeadPinned` scrolls Packages until the running head pins, then audits. It reports "Dynamic Type font sizes are partially unsupported" on card C1: the pill "5 left · $9.50" and the seller "Gamma Cards", at y 749 to 775, clear of the tab bar. It fails on every measured run (3 of 3, 2026-10-28). The same card text passes the unpinned Packages-screen audit once 4401da3 is dropped. Two suspects: the seller's `.minimumScaleFactor(0.5)` (debt `native-seller-scale-unmeasured`) and the pill's `.fixedSize()` in `native/Manifest/PackagesView.swift`. Naming a text style for each font (4401da3) did not clear it, and it broke the Packages-screen audit. The gap closes when the pinned audit passes with no trait dropped, fixed-size font, hidden element or skip.

**Status:** open. Step 5 merges with it open.

**Decision:** `masthead-running-head-sticky`.
