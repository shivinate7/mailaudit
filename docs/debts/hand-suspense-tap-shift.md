# A tap on a match shifts rows under the finger

**What.** On Card in Hand, a tap on a match collapses the list to the tapped row. A tapped row at index 1 or later slides up to the first slot under the finger. When the tapped name is one two open envelopes share, the Suspense box that opens below the list also rises into the space the list left. No test pins either move (`testTappingAMatchDoesNotMoveNewEnvelope` pins only New envelope). A likely fix is to hold the list's height until the next keystroke. The gap closes when a tap on a match moves no row and no box, and a test pins it.

**Status:** open.

**Decision:** `no-layout-shift-under-pointer`.
