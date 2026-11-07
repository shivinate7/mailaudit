# A tap on a match shifts rows under the finger

**What.** On Card in Hand, a list that collapses to the tapped match slides a row at index 1 or later up under the finger. For a name two open envelopes share, the Suspense box below the list also rises over the finger. The hold keeps every row in place until the next keystroke. `testTappingAMatchMovesNoRowUnderTheFinger` and `testTappingAMatchDoesNotMoveNewEnvelope` pin both moves. The gap closes when a run the merge tool can read shows them green.

**Status:** Fixed in code at 7893b7a; the local Duo run is pending. Retire waits for a CI path that runs Duo UI tests.

**Decision:** `no-layout-shift-under-pointer`.
