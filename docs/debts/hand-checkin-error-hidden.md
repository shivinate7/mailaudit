# A failed check-in in Card in Hand shows nowhere

**What.** On the open Duo, Card in Hand draws an opaque page over Packages. Packages' `checkin-error` message sits under it. Card in Hand shows only its own `hand.error`. So when a line check-in fails to save, nothing on screen says so. It is rare, but the save fails silently. The gap closes when a failed check-in shows on the Card in Hand page, and a test pins it.

**Status:** open. It can mislead the owner on a mail day, so it gets the first fix lane after wave 3 lands, red test first (orchestrator, 2026-10-28 23:45 CDT).

**Decision:** `ux-house-rules-govern`.
