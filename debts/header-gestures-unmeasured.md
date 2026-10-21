# Header gestures are unmeasured

**What.** No device ran a phone long-press on the package header. No browser ran a Mac double-click or triple-click there. From the click handler, a double-click that lands on header text toggles the card once, on its first click, then selects the word. A double-click that means "collapse" collapses once, and the second click does not reopen it. The owner ruled on 2026-10-21 that this stays a known gap. The code predicts both gestures, and neither one ran. The gap closes when a device run and a browser run measure each gesture, and the owner rules on each toggle that surprises the owner.

**Status:** open. The double-click is a known gap by the owner's ruling of 2026-10-21. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
