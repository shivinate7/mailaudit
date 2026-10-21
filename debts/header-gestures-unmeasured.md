# Three header gestures are unmeasured

**What.** No device ran a phone long-press on the package header. No browser ran a Mac double-click or triple-click on it, or a chevron tap while header text is selected. From the click handler, a double-click on header text toggles the card once, on its first click, then selects the word. A chevron tap is ignored while a selection lies in the header. Both are expected from the code and not run. The gap closes when a device run and a browser run measure each gesture, and the owner rules on each toggle that surprises the owner.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
