# The Duo has no stacked poses

**What.** Ruled item 28 of `duo-card-in-hand` sets the stacked poses, laptop and held tall. The answer page goes on top, and the system tab bar sits at the bottom of the screen. Nothing builds this. `HandScreen` handles side-by-side pages only, and `hand-open` shows on two pages side by side only. The gap closes when Card in Hand opens in a stacked pose with the answer page on top and the system tab bar at the bottom. It also needs a test that pins it.

**Status:** open.

**Decision:** `duo-card-in-hand`.
