# No test pins the match row above the keys at large text

**What.** On Card in Hand on the open Duo, the mockup `duo-hand-notice-match` shows the first match row whole above the keys at AX3. Built, the page sits about 63 pt lower than drawn (design review, 2026-11-07), so the row's clearance needed a measure. Duo 1, flat pose, 2026-11-08, one match (Path to Exile), keys up: at AX3 (AccessibilityXL) the row ends at 391.7 pt. That is 57 pt above the keyboard frame's top (449 pt) and 13 pt above the drawn keys (405 pt, `duo-fold-and-keyboard`). At AccessibilityM the gaps are 102 and 58 pt, and at the default size 110 and 66 pt. So the row clears the keys at AX3 with no box. The measuring class is DuoMeasureUITests (branch archive/duo-ax-measure, 096da19). The test testMatchRowClearsTheKeysAtAccessibilityXL now pins it. It went red on a mutant with 20 pt added above the field (row end 411.7 pt) and green on the code (Duo 1, 2026-11-08 08:10 CST).

**Status:** Pinned by testMatchRowClearsTheKeysAtAccessibilityXL at 4ab76b8; the test passes locally on Duo (2026-11-08). Retire waits for a CI path that runs Duo UI tests.

**Decision:** `duo-card-in-hand`.
