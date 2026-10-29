# The Duo left page scrolls 76 pt past its end

**What.** On the open Duo, DuoSystemBar reserves the custom bar's height as a bottom scroll margin in every tab. The margin also reaches the left page's scroll views (Card in Hand, the Tally list, the Orphaned list), but the bar sits under the right page only. So each left page ends with 76 pt of empty scroll room. The DuoPages comment in `DuoSpine.swift` still says the left page "takes back" an inset, and no inset exists now. The spread test says left rows "may" run to the window's bottom edge, so it cannot catch this. Found by reading, unmeasured. A likely fix gives the left page a zero margin. The gap closes when the left page ends at its last row, and a test pins it.

**Status:** open.

**Decision:** `duo-card-in-hand`.
