# Packages group by order and seller

The Packages view groups lines by order and seller. Each group is one card. The group key is the order id joined to the seller.

**Holds while:** `gkOf` in `src/view-rules.mjs` builds each package key from the order id and the seller. `groupPackages` in the same file groups lines by that key. V4.4 in `test/view-rules.test.mjs` pins one order from two sellers as two packages.

A card expands and collapses. Its progress bar draws along the card's top edge. See `card-the-bar-is-out-of-flow`.

The action row holds "Mark all received" and "Clear check-ins". It keeps a reserved height. See `card-the-action-row-is-reserved`.

When every line is received, a rotated RECEIVED stamp replaces the count badge.

A whole-row tap toggles a line. Names wrap to two lines. A quantity above one shows a stepper. Its partial state is an indeterminate dash.

## See also

- `card-the-bar-is-out-of-flow` — where the progress bar sits.
- `card-the-action-row-is-reserved` — why the action row keeps its height.
- `motion-completed-package-gilded` — the completion mark on a finished card.
- `motion-the-stamp-lands` — how the RECEIVED stamp appears.
