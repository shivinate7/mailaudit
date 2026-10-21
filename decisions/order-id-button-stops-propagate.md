# The order id link stops propagation

The order-id button in Tally stops its click from reaching the row underneath. The row checks a card in on any tap. Without the stop, a navigation tap would silently write to the ledger. That is the exact mis-tap that `no-layout-shift-under-pointer` exists to prevent.

**Holds while:** the order-id button in `ItemRow` in `src/app.jsx` calls `e.stopPropagation()` before it opens the order. The `onClick` of the row toggles a check-in.

The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would wipe the reveal on the very next commit.

`revealed` is ephemeral UI state, and it is never persisted. The five-site rule in `saved-state-shape` does not apply to it. Group 32 covers this.

**Pinned by:** group 32. Mutant confirmed red: the order-id button losing its `stopPropagation`. That turns a look into a check-in.

## The package header: copy the id, select the text, open TCGplayer

The package card's header is plain text, not one button. The owner ruled on 2026-10-20 that the header does three things:

- **The order id is its own control.** The id sits on its own line. One tap copies it to the clipboard and a short "Copied" stamp shows for 1.8 seconds. The tap calls `e.stopPropagation()`, so it never toggles the card. A write the browser refuses stamps nothing. The stamp lands like the RECEIVED stamp (`motion-the-stamp-lands`), and reduced motion draws it with no animation. It sits in a fixed 72 by 20px slot that is always there, so nothing moves when it shows or goes (`no-layout-shift-under-pointer`).
- **The header text selects.** A drag on a Mac and a long-press on a phone select the seller, the date and the tracking text. A click that ends with a non-empty selection inside the header does not toggle the card. A plain click, and a click with a bare caret, still do. The chevron is the only button in the header and the keyboard's way to toggle. It has no handler of its own: its click bubbles to the header's.
- **A link opens TCGplayer.** It sits beside the id, opens in a new tab with `rel="noopener"`, and stops its click. No per-order buyer URL on TCGplayer is confirmed (searched 2026-10-20; the help pages name only the Order History page and the seller-side order-number search). So the link opens the buyer order-history page, `https://store.tcgplayer.com/myaccount/orderhistory`, and the id just copied finds the order there. Change `TCGPLAYER_ORDERS` in `src/app.jsx` when a per-order URL is confirmed.

**Holds while:** the order-id button and the TCGplayer link in `PackageCard` in `src/app.jsx` each call `e.stopPropagation()`, and the header toggles from a `div` whose click handler returns early on a non-empty selection inside it.

On a phone each control keeps a 44px touch area (the house `::after` grow). The id button is 45px wide at least, so its area stays off the chevron's. The 16px under the id line keeps the areas off the row below. The chevron is 44px wide and the header's full height.

**Pinned by:** group 75 (the copy, the stamp, the selection guard, the link, a refused write, the stamp's life, no control inside a control, no dialogs). `check:screens` claim 16 pins what jsdom cannot see: Copied moves nothing, the clipboard holds the id, and a mouse drag selects header text and leaves the card open. Claims 9 and 11 pin the touch areas. Unmeasured: the phone long-press, since no device ran it.

## The order id stays visible

The order id stays visible. The owner ruled on 2026-10-11, accept all: keep the order id visible, with the 10px floor in `typography-cochin-and-mono`. In the package header the id has its own line, so it keeps its whole length down to the width of the line (a 21-character id shows whole at 375px, seen in a render). A longer id ends in an ellipsis, shows whole in its `title`, and copies whole. The Tally source row still ends a long id in an ellipsis.

**Status:** built for the package header on 2026-10-20. Open for the Tally source row. Debt: `order-id-visible-unbuilt`.

Kind: build

Plan: decisions/order-id-button-stops-propagate.md#the-order-id-stays-visible (web)

## See also

- `search-filters-inside-package` — the feature this control belongs to.
- `a-reveal-ignores-hidedone-too` — the reveal rule this button triggers.
