# New envelope moves under the finger when a Suspense box shows

**What.** On Card in Hand on the open Duo, the Suspense box (`hand-held`) sits above the "This envelope" row. A press on New envelope ends the envelope: the Suspense box leaves and its name joins the Released box, which is shorter. The row and its New envelope button move up by about one box height under the finger, against invariant `no-layout-shift-under-pointer`. Read from the code and the mockup `duo-hand-notice-match` (designer, 2026-11-06); not yet measured on the simulator. The gap closes when a test presses New envelope with a Suspense box shown and finds the button's frame unchanged.

**Status:** open.

**Decision:** `duo-card-in-hand`.
