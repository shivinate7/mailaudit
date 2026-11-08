# No test pins the match row above the keys at large text

**What.** On Card in Hand on the open Duo, the mockup `duo-hand-notice-match` shows the first match row whole above the keys at AX3. Built, the page sits about 63 pt lower than drawn (design review, 2026-11-07), so the row's clearance needed a measure. Duo 1, flat pose, 2026-11-08, one match (Path to Exile), keys up: at AX3 (AccessibilityXL) the row ends at 391.7 pt. That is 57 pt above the keyboard frame's top (449 pt) and 13 pt above the drawn keys (405 pt, `duo-fold-and-keyboard`). At AccessibilityM the gaps are 102 and 58 pt, and at the default size 110 and 66 pt. So the row clears the keys at AX3 with no box. The measuring class is DuoMeasureUITests (branch archive/duo-ax-measure, 096da19). No test pins the figure, so a later change could push the row under the keys unseen. A test at AX3 with the keys up that finds the row whole above the drawn keys closes the gap.

**Status:** open, measured 2026-11-08.

**Decision:** `duo-card-in-hand`.
