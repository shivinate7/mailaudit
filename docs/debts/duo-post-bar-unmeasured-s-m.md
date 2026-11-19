# The pinned Post bar is unmeasured at S and M

**What.** On Card in Hand on the open Duo, the pinned Post bar is judged only at L. The duo-ui run (44479867180) shoots Post tests at the default size only, so no run shot the bar at S or M. The decision (`duo-card-in-hand`, item 42 b, 2026-11-18 23:22 CST) states 61 pt at S, M and L. The code gives that figure as the 44 pt row, 8 pt above and below it, and a 1 pt hairline (`HandScreen.swift`, the Post bar). No run has measured the bar at S or M. The 44 pt hit frame may hold the bar at 61 pt at those sizes, but that is unmeasured. AX3 and AX5 are not judged. They await owner items 104 and 105.

Two design-review findings sit beside it. Both have unmeasured causes:

- At L the Post sentence wraps to 2 lines. Real Cochin is wider than the mockup's stand-in font.
- At rest 2 whole lines of the answer page show, where the mockup showed 3. The mockup assumed a 20 pt status bar. The measured top inset is about 80 pt.

**Status:** open. Waits for a shot of the pinned Post bar at S and M. AX3 and AX5 wait for owner items 104 and 105.

**Decision:** `duo-card-in-hand`.
