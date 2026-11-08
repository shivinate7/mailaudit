# No test pins the tapped name's sideways place

**What.** On Card in Hand on the open Duo, every match row pads 10 pt, so a tap adds the accent bar in the gutter and the name does not move. No UI test pins the name's horizontal place. A static-text read finds no frame for the name on any build. A pixel scan of the row (branch hand-tap-shift-t5) passed a mutant that puts the 10 pt shift back. So a later sideways shift of the tapped name passes the tests. The design review judges it from shots instead; it passed on Duo 1, open pose, light theme (2026-11-07). A check that goes red on that mutant and green on the fix closes the gap.

**Status:** open.

**Decision:** `duo-card-in-hand`.
