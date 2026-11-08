# At AccessibilityL the Card in Hand control sits under the tab bar

**What.** On the open Duo, Packages shows the `hand-open` control near the top of the right page. At AccessibilityL the masthead grows and pushes the control down to y 616 to 660 pt, inside the Duo tab bar (y 593 to 657 pt, x 520 to 927 pt). XCUITest reports it hittable, but a tap on it did not open Card in Hand, so the bar most likely takes the tap. At the default size it sits at y 416 pt and opens. At XXL and XXXL it starts below the window (y 712 and 761 pt), but one swipe brings it up to y 179 and 228 pt, and a tap opens Card in Hand. Measured on Duo 1, flat pose, 2026-11-08, 08:06 to 08:08 CST, with `DuoMeasureUITests.testReach*` (branch archive/duo-reach-measure, d365720). So at about AccessibilityL, Card in Hand may be out of reach unless the page scrolls the control clear of the bar. Whether a swipe at L does that is unmeasured, because the run took the control for hittable and did not swipe.

**Fix.** First confirm the cause: at L, swipe the right page up and tap again. If the swipe clears it, the right page needs bottom room for the bar, so the control can scroll above it, and a test pins the tap at L. If not, move `hand-open` out of the masthead's flow, for example pin it above the masthead. `hand-open` lives in PackagesView, a Restyle file, so the fix goes to that lane.

**Status:** open.

**Decision:** `duo-card-in-hand`.
