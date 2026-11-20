# The pinned Post bar is unmeasured at S and M

**What.** On Card in Hand on the open Duo, the pinned Post bar is 53 pt (owner item 103 b, 2026-11-19 19:26 CST; decision `duo-card-in-hand`): a 1 pt hairline, 4 pt, the 44 pt Post button, 4 pt. Its text is capped at xxxLarge (item 104 a), and the head shows the seller only from AX3 (item 105 a). Both are built now. UI tests read them: `testPostOfferBarIsFiftyThreePointsTall` (L), `testPostOfferBarStaysFiftyThreePointsTallAtAccessibilityXXXL` (AX5), `testPostReceiptIsOneRowFiftyThreePointsTall`, `testPostReceiptIsOneRowFiftyThreePointsTallAtAccessibilityXXXL`, `testPostBarPinsAboveTheKeysAtTheirDrawnTop` (4 pt foot, 2 pt tolerance), `testHeldSentenceLeavesTheScreen`, `testHeadKeepsItsSenderLineAtTheNormalSize` (runs at the normal size), `testHeadShowsOnlyTheSellerAtAccessibilityXL` and `...XXXL`, and `testHeadSpeaksItsFullTextAtAccessibilityXL`. No run has read them on the built screen yet. Still unmeasured: the bar's height at S, M and AX3, which no test launches, and the refused receipt ("Not posted."), which no test forces. The Post button's VoiceOver hint and the large-content viewer are not read by XCUITest. Neither the 53 pt figure nor the AX3 and AX5 heads have been seen on a device. The head at AX1 and AX2 is untested. At AX2 the hand did not open on a tap (measured, debt `hand-open-under-bar-at-l`); AX1 is unmeasured. The slim head's top pad (8 pt, from the mockup) and its VoiceOver reading (the seller as label, the rest as value on `hand-who`) are code-read only; the large-content viewer on the Post button is outside its own xxxLarge cap but inside the bar's cap, unverified.

One design-review finding sits beside it. Its cause is unmeasured:

- At rest 2 whole lines of the answer page show, where the mockup showed 3. The mockup assumed a 20 pt status bar. The measured top inset is about 80 pt.

Four more unmeasured notes, from the code.

- **Bottom pad.** `HandScreen.swift` pads the pinned bar by `DuoBarMetrics.height` (76 pt) from the right page's bottom. `DuoTabBar`'s pill sits 76 pt above the window bottom. With a bottom safe inset, the bar may float above the pill. Unmeasured. No test runs with the keys down.
- **Keys state at build.** `keysUp` starts `false`. It changes only on the keyboard show and hide notifications. A screen built while the keys are up would take the keys-down pad. Reach is low, because native Packages has no text field. Unverified.
- **Pin test.** `testPostBarPinsAboveTheKeysAtTheirDrawnTop` now reads a 4 pt foot within 2 pt, so a bar with no foot pad fails. Unmeasured on a device.
- **Scroll margin.** `DuoSystemBar` (`DuoSpine.swift`) gives the scroll content a bottom margin of `DuoBarMetrics.height`, 76 pt. The margin may let the lines pane scroll 76 pt past its end, above the Post bar. Unverified. See `duo-keyboard-gap-unmeasured` and `duo-left-page-dead-margin`.

**Status:** open. Waits for a run of the new tests on the built screen, and for a shot of the pinned Post bar at S and M and of the refused receipt.

**Decision:** `duo-card-in-hand`.
