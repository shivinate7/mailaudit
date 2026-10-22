# Order id controls stop their clicks

The order-id button in Tally stops its click from reaching the row underneath. The row checks a card in on any tap. Without the stop, a navigation tap would silently write to the ledger. That is the exact mis-tap that `no-layout-shift-under-pointer` exists to prevent.

**Holds while:** the order-id button in `ItemRow` in `src/app.jsx` calls `e.stopPropagation()` before it opens the order. The `onClick` of the row toggles a check-in.

The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would wipe the reveal on the very next commit.

`revealed` is ephemeral UI state, and it is never persisted. The five-site rule in `saved-state-shape` does not apply to it. Group 32 covers this.

**Pinned by:** group 32. Mutant confirmed red: the order-id button losing its `stopPropagation`. That turns a look into a check-in.

## The package header: the id is a link, the text selects

The package card's header is plain text, not one button. The owner ruled on 2026-10-21 00:10 CDT, superseding the 2026-10-20 copy button: "make the order # a hyperlink and have these be the link, so as example if order is: 025F898A-605522-F2EDE link is then https://store.tcgplayer.com/myaccount/orderhistory?SearchString=025F898A-605522-F2EDE". Asked what a refused copy should show, the owner answered "see 1": the copy button and its Copied stamp go away. The header does two things:

- **The order id is a link to TCGplayer.** The id sits on its own line. It is an `<a>` to `https://store.tcgplayer.com/myaccount/orderhistory?SearchString=<id>`, with the id passed through `encodeURIComponent` (`tcgplayerOrderUrl` in `src/app.jsx`), in a new tab with `rel="noopener"`. Its click calls `e.stopPropagation()`, so it never toggles the card or checks anything in. Nothing copies: there is no copy button, no Copied stamp, no clipboard code and no second TCGplayer link. The owner's example id `025F898A-605522-F2EDE` gives `...orderhistory?SearchString=025F898A-605522-F2EDE`. Whether TCGplayer applies `SearchString` on that page is unconfirmed, because the page sits behind sign-in. Debt: `tcgplayer-link-opens-history-list`.
- **The header text selects.** A drag on a Mac and a long-press on a phone select the seller, the date and the tracking text. A click that ends with a non-empty selection inside the header does not toggle the card. A plain click, and a click with a bare caret, still do. The chevron is the keyboard's way to toggle. Its name ends with the order id (`Collapse Beta Games, order B1`), so two orders from one seller have different names. It has its own click handler that always toggles and stops its click, so a selection never swallows it and the header never toggles twice.

**Holds while:** the order-id link in `PackageCard` in `src/app.jsx` calls `e.stopPropagation()`. The chevron toggles on its own click. The header toggles from a `div`, and its click handler returns early on a non-empty selection inside it.

On a phone the link keeps a 45px touch area (the house `::after` grow). It is 45px wide at least, so its area stays off the chevron's. The area reaches 14.5px past the 16px id line. Chromium moves a real tap that lands near a link onto the link. A hit test (`elementFromPoint`) cannot see that move. So the id line sits 28px under the date line and 28px above the header's bottom edge. That leaves 13.5px of clear header between the area and each neighbour. The header is 115px tall, see `card-reserved-geometry`.

Measured 2026-10-21 at `3de6c03` by `check:screens` claim 17a, in Chromium. It sends real touches (1px and 12px contact radius) at 320 and 375px, on Alpha stamped and unstamped. The taps cover the drawn boxes of the seller name, the date line, the chevron and the row under the header. That row is the Stamp band, or the action row's buttons. The link's own area is left out, and so is header whitespace, because a tap there is as likely meant for the link. A run sweeps 10,868 to 12,696 taps. In each of the 8 runs (4 cases, 2 radii), 0 taps opened TCGplayer.

The sweep goes red on the defect it guards. Spaced 16px from the date line and from the row below (the page at `1d3c5d0`), the link took 418 to 838 taps per run. They hit the date line, and unstamped also the action row. They lay at most 9.8px (1px contact) and 11.8px (12px contact) outside the link's area.

**Pinned by:** group 76, 33 cases (the link and its URL, no copy control, the selection guard, the chevron under a selection, no dialogs). `check:screens` claim 17a pins what jsdom cannot see: no real Chromium tap meant for the seller name, the date line, the chevron or the row under the header opens TCGplayer. The chevron toggles under a click, a tap and Enter while text is selected. A mouse drag selects header text and leaves the card open. Claims 9 and 11 pin the touch areas. Claim 10 holds the re-recorded boxes of Packages and Stamp editor open. Nothing pins the phone long-press, or a Mac double-click or triple-click. A double-click that means "collapse" collapses once, and the owner ruled on 2026-10-21 that this stays a known gap. Debt: `header-gestures-unmeasured`. Nothing pins iOS WebKit's touch adjustment near the link. Debt: `ios-touch-adjust-unmeasured`.

Scope: both clients. The owner ruled on 2026-10-21 that the native app gets the same feature, see `native-parity-table`. The web app has it. The native app does not yet. Debt: `native-order-id-link-unbuilt`.

## The order id stays visible

The order id stays visible. The owner ruled on 2026-10-11, accept all: keep the order id visible, with the 10px floor in `typography-cochin-and-mono`. In the package header the id has its own line, so it keeps its whole length down to the width of the line. Measured 2026-10-21 at `3de6c03`: the 21-character id `025F898A-605522-F2EDE` is 139px wide. It shows whole at 320, 375 and 760px, and the header leaves it 238px at 320px. A longer id ends in an ellipsis, shows whole in its `title`. The Tally source row still ends a long id in an ellipsis.

**Status:** built for the package header on 2026-10-20. Open for the Tally source row. Debt: `order-id-visible-unbuilt`.

Kind: build

Plan: decisions/order-id-button-stops-propagate.md#the-order-id-stays-visible (web)

Plan: decisions/order-id-button-stops-propagate.md#the-package-header-the-id-is-a-link-the-text-selects (web)

Plan: decisions/native-parity-table.md#both-clients (native)

## See also

- `search-filters-inside-package` — the feature this control belongs to.
- `a-reveal-ignores-hidedone-too` — the reveal rule this button triggers.
