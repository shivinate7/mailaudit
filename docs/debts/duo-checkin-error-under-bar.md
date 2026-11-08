# A Packages check-in error can sit under the Duo bar

**What.** On the open Duo, the Packages `checkin-error` overlay sits at the tab's bottom edge. It used to sit above the bar's room, but that room is now a scroll margin, not an inset, and the custom bar draws over the page. So the right half of a check-in failure message can sit under the bar. No test covers it, and the overlap is unmeasured. The gap closes when the message clears the bar on the open Duo, and a test pins it.

**Status:** open.

**Decision:** `duo-card-in-hand`.
