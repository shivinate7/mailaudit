# The pinned Post bar is unmeasured at S and M

**What.** On Card in Hand on the open Duo, the pinned Post bar is judged only at L. The duo-ui run (44479867180) shoots Post tests at the default size only, so no run shot the bar at S or M. The decision (`duo-card-in-hand`, item 42 b, 2026-11-18 23:22 CST) states 61 pt at the normal text size, measured at L. That figure rests on the receipt test, which reads the receipt's height, not the offer bar's (`testPostReceiptIsOneRowAboutSixtyOnePointsTall`). The code gives that figure as the 44 pt row, 8 pt above and below it, and a 1 pt hairline (`HandScreen.swift`, the Post bar). No run has measured the bar at S or M. The 44 pt hit frame may hold the bar at 61 pt at those sizes, but that is unmeasured. AX3 and AX5 are not judged. They await owner items 104 and 105.

Two design-review findings sit beside it. Both have unmeasured causes:

- At L the Post sentence wraps to 2 lines. Real Cochin is wider than the mockup's stand-in font.
- At rest 2 whole lines of the answer page show, where the mockup showed 3. The mockup assumed a 20 pt status bar. The measured top inset is about 80 pt.

Four more unmeasured notes, from the code.

- **Bottom pad.** `HandScreen.swift` pads the pinned bar by `DuoBarMetrics.height` (76 pt) from the right page's bottom. `DuoTabBar`'s pill sits 76 pt above the window bottom. With a bottom safe inset, the bar may float above the pill. Unmeasured. No test runs with the keys down.
- **Keys state at build.** `keysUp` starts `false`. It changes only on the keyboard show and hide notifications. A screen built while the keys are up would take the keys-down pad. Reach is low, because native Packages has no text field. Unverified.
- **Pin test.** `testPostBarPinsAboveTheKeysAtTheirDrawnTop` (`DuoHandUITests.swift`, about line 519) passes when the Post button's bottom sits within 10 pt of the keys' drawn top, either side (8 pt plus the 2 pt tolerance). Its comment says 8 pt above and 2 pt on top. So a bar with no foot pad also passes. Unmeasured on a device.
- **Scroll margin.** `DuoSystemBar` (`DuoSpine.swift`) gives the scroll content a bottom margin of `DuoBarMetrics.height`, 76 pt. The margin may let the lines pane scroll 76 pt past its end, above the Post bar. Unverified. See `duo-keyboard-gap-unmeasured` and `duo-left-page-dead-margin`.

**Status:** open. Waits for a shot of the pinned Post bar at S and M. AX3 and AX5 wait for owner items 104 and 105.

**Decision:** `duo-card-in-hand`.
