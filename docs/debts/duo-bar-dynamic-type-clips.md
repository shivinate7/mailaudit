# The Duo tab bar labels clip at accessibility text sizes

**What.** The open Duo's tab bar is a fixed 64 pt pill, while its labels scale with Dynamic Type. At every accessibility text size, all four labels clip. Measured on Duo 1, flat pose, 2026-11-08: at the default size each label fits (14 pt tall, nothing past the pill). From AccessibilityM up, each label reads as truncated. Each also runs 4.5 pt (M) to 12 pt (XXL and XXXL) past the pill's foot. Ledger runs 1 to 20 pt past the pill's left edge, and Packages 10 to 20 pt past its right. From XXL the pill widens to 407 pt and more, but its height stays 64 pt. The measuring class is DuoMeasureUITests (branch archive/duo-ax-measure, 096da19).

**Status:** Fixed in code at 06b7637; DuoSpreadUITests not yet run locally on Duo.

**Decision:** `duo-card-in-hand`.
