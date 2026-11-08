# A Recent UNDO cell can sit half under the bottom bar

**What.** At 375px with the page at the top, the first open Recent row's UNDO cell spans y 705 to 777. The bottom bar starts at y 736, so the word UNDO sits half under it. A tap on the bar's body opens the Packages tab. No tap on the bar runs an undo, so the worst case is a mis-tap that changes the tab. Measured 2026-11-06 in Chromium with touch input through the browser's own protocol. The bar covers the foot of every tab the same way (`phone-nav-is-bottom-bar`). The mockup accepted the panel running under the bar and ruled out a scroll on open.

**Status:** open. The gap closes when no visible control can sit under the bar, or the owner accepts the overlap.

**Decision:** `recent-checks-can-be-undone`.
