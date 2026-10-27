# The active view moves one object, not three lights

The ruling: the active-view fill is a single element that slides between thirds. Three buttons never light up on their own. That ruling was for the top view switch. L11a retired the switch and its violet fill. The bar has no sliding fill, and this ruling covers the bar only if the owner rules that it does.

**Status:** open. The owner has not ruled whether the bar's active pill slides as one object. The build sets no transition on the active tab.

**Holds while:** the bar marks the current tab with `aria-current="page"` on its button. Tests 43.1 and 43.2 pin it. The retired switch used a violet thumb element and `data-view`. Both are gone.

`aria-current` is the only thing that says which tab is active. Drop it, and the bar shows no active tab. Every tab still looks correct in a DOM dump.

The retired thumb sat at exactly a third of the track. It moved by whole multiples of its own width, so it stayed on the thirds the grid defined. The buttons painted no background of their own, so no second fill showed mid-slide. L11a removed the thumb and its transition.

## See also

- `switch-thirds-and-seal` — the retired thirds and thumb figures.
- `design-view-switch-equal-thirds` — the retired switch layout.
- `phone-nav-is-bottom-bar` — the bar that now holds the active tab.

**Pinned by:** 43.1 and 43.2 (the current tab follows the view).
