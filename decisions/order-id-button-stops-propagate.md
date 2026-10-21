# Order id controls stop their clicks

The order-id button in Tally stops its click from reaching the row underneath. The row checks a card in on any tap. Without the stop, a navigation tap would silently write to the ledger. That is the exact mis-tap that `no-layout-shift-under-pointer` exists to prevent.

**Holds while:** the order-id button in `ItemRow` in `src/app.jsx` calls `e.stopPropagation()` before it opens the order. The `onClick` of the row toggles a check-in.

The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would wipe the reveal on the very next commit.

`revealed` is ephemeral UI state, and it is never persisted. The five-site rule in `saved-state-shape` does not apply to it. Group 32 covers this.

**Pinned by:** group 32. Mutant confirmed red: the order-id button losing its `stopPropagation`. That turns a look into a check-in.

## The package header: the id is a link, the text selects

The package card's header is plain text, not one button. The owner ruled on 2026-10-21 (superseding the 2026-10-20 copy button) that the header does two things:

- **The order id is a link to TCGplayer.** The id sits on its own line and is an `<a>` to `https://store.tcgplayer.com/myaccount/orderhistory?SearchString=<id>` (`tcgplayerOrderUrl` in `src/app.jsx`), in a new tab with `rel="noopener"`. Its click calls `e.stopPropagation()`, so it never toggles the card or checks anything in. Nothing copies: there is no copy button, no Copied stamp and no second TCGplayer link. The owner's example: id `025F898A-605522-F2EDE` gives `...orderhistory?SearchString=025F898A-605522-F2EDE`. Whether TCGplayer honours `SearchString` on that page is unconfirmed, because the page sits behind sign-in. Debt: `tcgplayer-link-opens-history-list`.
- **The header text selects.** A drag on a Mac and a long-press on a phone select the seller, the date and the tracking text. A click that ends with a non-empty selection inside the header does not toggle the card. A plain click, and a click with a bare caret, still do. The chevron is the keyboard's way to toggle. It has its own click handler that always toggles and stops its click, so a selection never swallows it and the header never toggles twice.

**Holds while:** the order-id link in `PackageCard` in `src/app.jsx` calls `e.stopPropagation()`, the chevron toggles on its own click, and the header toggles from a `div` whose click handler returns early on a non-empty selection inside it.

On a phone the link keeps a 45px touch area (the house `::after` grow). It is 45px wide at least, so its area stays off the chevron's. The area reaches 14.5px past the 16px id line. The id line sits 16px under the date line and 16px above the row below, so the area reaches neither the date line nor the next row.

**Pinned by:** group 75 (the link and its URL, no copy control, the selection guard, the chevron under a selection, no dialogs). `check:screens` claim 16 pins what jsdom cannot see: the link's touch area reaches neither the seller name nor the date line, the chevron toggles under a click, a tap and Enter while text is selected, and a mouse drag selects header text and leaves the card open. Claims 9 and 11 pin the touch areas. Nothing pins the phone long-press, or a Mac double-click or triple-click. Debt: `header-gestures-unmeasured`. The header's new height is unmeasured. Debt: `packages-header-geometry-unmeasured`.

Scope: the web app. The owner ruled on 2026-10-21 that the native app gets the same feature in a later native lane. Debt: `native-order-id-copy-unscoped`.

## The order id stays visible

The order id stays visible. The owner ruled on 2026-10-11, accept all: keep the order id visible, with the 10px floor in `typography-cochin-and-mono`. In the package header the id has its own line, so it keeps its whole length down to the width of the line (a 21-character id shows whole at 375px, seen in a render; 320px is unmeasured, debt `packages-header-geometry-unmeasured`). A longer id ends in an ellipsis, shows whole in its `title`. The Tally source row still ends a long id in an ellipsis.

**Status:** built for the package header on 2026-10-20. Open for the Tally source row. Debt: `order-id-visible-unbuilt`.

Kind: build

Plan: decisions/order-id-button-stops-propagate.md#the-order-id-stays-visible (web)

Plan: decisions/order-id-button-stops-propagate.md#the-package-header-copy-the-id-select-the-text-open-tcgplayer (web)

## See also

- `search-filters-inside-package` — the feature this control belongs to.
- `a-reveal-ignores-hidedone-too` — the reveal rule this button triggers.
