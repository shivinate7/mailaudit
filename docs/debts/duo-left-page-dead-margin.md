# The Duo left page scrolls 76 pt past its end

**What.** On the open Duo, DuoSystemBar reserves the custom bar's height as a bottom scroll margin in every tab. The margin also reaches the left page's scroll views (Card in Hand, the Tally list, the Orphaned list), but the bar sits under the right page only. So with the keys down, each left page ends with 76 pt of empty scroll room. The margin is not dead, though. With the keys up, it keeps the last row above them (keys at about 405 pt, `duo-fold-and-keyboard`). It also keeps the last row clear of the error bar that TallyView and OrphanedView lay over the list. A zero left margin, tried on branch duo-left-margin (764a832), put the last row under both, so it was withdrawn (review round 1, 2026-11-07). The DuoPages comment in `DuoSpine.swift` still says the left page "takes back" an inset, and no inset exists now.

**Fix.** The error bar becomes a bottom inset of the list, not an overlay, in TallyView and OrphanedView. The left page's margin then follows the keyboard only. Restyle owns those views, so this fix belongs with restyle's step 8 or later. The gap closes when the left page ends at its last row with the keys down, keeps it above the keys and the error bar, and tests pin all three.

**Status:** open, low priority. Waits for restyle's step 8 (coordinator, 2026-11-07 20:04 CST).

**Decision:** `duo-card-in-hand`.
