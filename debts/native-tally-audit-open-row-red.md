# The native Tally audit fails on contrast with a row open

**What.** `TallyUITests.testAccessibilityAuditTallyScreenWithARowOpen` fails with "Contrast failed" on three elements: the `0/1` ratio, the meta line and the outstanding line of the Ponder row. The audit passes on the closed Tally screen and on every other Tally test. Opening Lightning Bolt adds three copies, which pushes the Ponder row under the glass tab bar at the screen's rest scroll position. The row's text sits behind the bar's icons and labels, and its first line is cut in half at the bar's edge. The palette is not at fault. Four view changes left the same three elements red on the iPhone 18 Pro simulator: clipping the scroll view, a hard scroll-edge effect, an opaque block under the bar, and a sibling that keeps the scroll view off the bar's edge. Any scrolling list with a row cut by the viewport would fail the same way. The gap closes when the audit runs on a state with no row cut or hidden by the bar, such as the open row under a search that leaves one product. That is a change to the test, and builders do not make it. Delete this entry then.

**Status:** open. The owner or a test-author decides the test state.

**Decision:** `native-build-lanes`.

**Decision:** `palette-tokens-contrast-floor`.
