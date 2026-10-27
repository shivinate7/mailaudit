# No UI test pins the native card header gestures

**What.** The owner ruled on 2026-10-21 that the card header text selects, seller included, and that the header's taps still work. The native seller and date lines carry a rectangle content shape, so neither takes the other's long press. The builder checked this by hand on the simulator. No UI test long-presses the seller or the date, checks a selection, or taps the order link. The gap closes when a UI test drives each gesture.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
