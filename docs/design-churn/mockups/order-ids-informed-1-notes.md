# Order ids: read, copy and follow an order number

Mockup: `order-ids-informed-1.html`. Designer kind: informed. Answered, owner page item 61 (owner, 2026-11-21 19:56 CST). Debts: `order-id-visible-unbuilt` (the Tally id ends in an ellipsis) and `tcgplayer-link-opens-history-list` (the link may open the whole list). Decision: `order-id-button-stops-propagate`. Invariant: `no-layout-shift-under-pointer`.

The pain, in the owner's words: "I need to paste the order number into a message." The job: read the whole number, copy it in one tap, and follow a link that lands on that one order.

## Deep links

`#c=today|whole|copy|slip` picks a concept. `#d=folded|ax5|open|phone|web` picks a device. `#s=copied|menu|jumped|slip|browser|refused` opens a state (`refused` is the web Copy beside row). `#link=search|page` picks the link target. `#t=light|dark` sets the theme. Join with `&`, for example `#c=slip&d=open&s=slip`. Each option has a Hide button at the top.

Focus ids for the waiting page: `focus-whole`, `focus-copy`, `focus-slip` (the first Alpha Cards order line of each concept), `focus-today`. For the link question, `#s=browser&link=search` gives `focus-link-search` and `#s=browser&link=page` gives `focus-link-page` (the address line of the browser stand-in).

## Sizes and sources

- Folded Duo: 466 x 678 pt, tab bar from y 595, 83 pt tall (`duo-fold-and-keyboard`, 2026-11-08). Open Duo: 951 x 669 pt, fold strip x 455.5 to 495.5; Tally spreads over both pages and the tab bar sits under the right page (`duo-card-in-hand`, items 23 and 24). A click test found no element across the fold strip.
- Large phone: `layout.py devices` prints `unknown` for this repo, and no record writes a size. Drawn at the folded Duo's 466 x 678 pt in a frame you can drag to another width. Its height is the same assumption.
- Row geometry from `ItemLine` in `native/Manifest/ItemLine.swift`: a 45 pt check frame holding a 30 pt box, spacing 8, 12 pt above, below and trailing. Only the box checks a card in natively, so the drawing does the same.
- Type: `Font.mono` and `Font.cochin` default to `relativeTo: .body` (`native/Manifest/Theme.swift`). The id is `.mono(10.5)`, so at AX5 it draws at 10.5 x 53/17 = 32.7 pt, and 21 characters need 21 x 0.602 x 32.7 = 414 pt. The folded row's text column is about 363 pt (466, less 16 + 16 list padding, 2 border, 4 + 45 + 8 before the column, 12 after). So at AX5 the id can never fit on one line.
- Apple pages read 2026-11-21, each answered 200: Typography (Large and AX5 tables: Body 17 and 53, Caption 1 12 and 43, Title 2 22 and 56), Accessibility, Buttons (44 x 44 pt hit region), Layout, Edit menus ("let people select and copy noneditable text"; "prefer the system-provided edit menu"), Context menus ("always make context menu items available in the main interface, too"), Activity views.
- Theme: the native app is held to light (`design-parchment-ledger`), so the native frames keep the light set. The web row follows the page theme, light and dark, from `shared/tokens.json`.
- Fonts: Menlo falls back to DejaVu Sans Mono (same advance). Cochin falls back to Liberation Serif, so seller widths are estimates.
- Sample: three invented orders in the 8-6-5 shape: Alpha Cards `7C41B09E-3A5F12-D80C4`, Beta Games `E93A6D21-0B7C48-15FAE`, Gamma Hobby `3B90D1C4-77A2E0-4C19B`.

## Today

- Native Tally: the id is plain `Text` with `.fixedSize()` (`ItemLine.lines`). It is not a link, and the comment says "Native has no such route yet". At AX5 it runs past the row and the frame cuts it (drawn).
- Web Tally: the id is a 30 px button that opens the order in Packages (`ItemRow`, `onOpenOrder`, `src/app.jsx`). It ends in an ellipsis when narrow. The 21-character sample fits at 320 px; a longer id or larger text is cut.
- Package header: the id is a link to `orderhistory?SearchString=<id>` (`tcgplayerOrderUrl`). Nothing copies. A long press on the link gives the system link menu, whose Copy Link copies the web address, not the number (drawn at `#c=today&s=menu`).

## Items

1. **Whole line.** The Tally id gets its own line. It wraps only at its dashes, never inside a group, and never ends in an ellipsis. On native it becomes the jump to Packages, as on the web (port default, `ItemRow` `onOpenOrder`), with a 44 pt hit height. Its tap stops at the button, so it never checks a card in. At AX5 it takes three lines.
   - Gain: closes `order-id-visible-unbuilt` on both clients, and gives native the web's jump. Keeps every ruling.
   - Loss: no one-tap copy. Within the rulings there is none: the package id is a link (a long press copies the address), the Tally id is a button (no text selection), and a copy control was ruled out.
   - Pick: yes, as the base of whichever copy option the owner picks. Owner grant: no.

2. **Copy beside.** Whole line, plus a Copy control at the trailing end of each order line, in Tally and in the package header. One tap copies the bare number with its dashes. The label reads Copied for 1.6 s, in a slot already as wide as "Copied", so nothing moves. Native adds a haptic and a spoken "Copied order number ...". At accessibility sizes the control drops under the number.
   - Web refused copy: the number selects itself and the control reads Selected, so the system's own Copy is one tap away (`#c=copy&d=web&s=refused`). This answers the question the owner answered on 2026-10-21.
   - Gain: meets all three asks. The control is plain and sits where the eye already is.
   - Loss: a Copy label on every copy line. In the package header a second control sits on the id line, 16 pt from the link's area. Check claim 17a (Chromium touch adjustment moved chevron taps onto the link) must be re-run, and `card-reserved-geometry` re-measured if the line grows.
   - Departs from: `order-id-button-stops-propagate`, "the copy button and its Copied stamp go away" (owner, 2026-10-21 00:10 CDT). That sentence protected one outcome: what a refused web copy shows. A native copy cannot be refused, and the refused web case now selects the number. Owner grant: yes.
   - Pick: yes, the plain choice.

3. **Order slip (the bold one).** The number is set as a three-part docket with its dashes, like a receipt's counterfoil. A tap on the docket copies it, and a COPIED stamp lands on its corner (the RECEIVED stamp's motion, `motion-the-stamp-lands`; reduced motion leaves it drawn). Order opens the order slip: the number large, Copy order number, Open on TCGplayer, Show in Packages, and every card in that envelope with its count. Folded, the slip is a sheet with Done on the trailing edge. On the open Duo it takes the right page, with a back button to the card.
   - Gain: one tap copies. The slip answers "what else was in that envelope?" without leaving Tally, which uses the open Duo's second page. It gives one home to all three order acts.
   - Loss: the id is no longer the link itself, so following the order takes two taps (Order, then Open on TCGplayer). The docket is a new shape for the app to learn. More to build: a sheet, a page and a stamp.
   - Departs from: `order-id-button-stops-propagate` twice: copy returns (as in item 2), and in the package header the id stops being the link ("make the order # a hyperlink", owner, 2026-10-21). Owner grant: yes.
   - Pick: no. Copy beside meets the same three asks with less to learn and keeps the id as the link. Keep this option on the page for the owner to cull; the slip's "In this envelope" list is worth taking on its own if the owner likes it.

4. **Where the link lands.** Two targets, a toggle on the page:
   - Order search, `https://store.tcgplayer.com/myaccount/orderhistory?SearchString=<id>`: the owner's ruled address. Whether the page applies the filter is unmeasured (debt `tcgplayer-link-opens-history-list`).
   - Order page, `https://store.tcgplayer.com/myaccount/orderhistory/order/<id>?x=1`: from the "View Order" button in the test copy of the order history page (`orderBlock` in `worker/core.test.mjs`, commit 4674e59c, ported from the orders-cron branch). Nobody has checked that the real page has this button or address.
   - Gain of the order page: it names one order, so it should land on it. Loss: its source is a test fixture, not the live site.
   - Pick: keep the ruled search address until the owner follows both links signed in. If the search opens the whole list and the order page opens the order, switch. Owner grant: yes (it changes a ruled address).

5. **Native Tally id gets the jump.** The port default: the web id opens the whole order in Packages, so native does too. No question; the route is builder work (`ItemLine` takes an action, `TallyView.copyLine` passes it).
   - Gain: the two clients match, and native gets an answer to "what else was in that envelope?".
   - Loss: a second control on each copy line besides the check box; its tap must stop at the id, as on the web.
   - Pick: yes. Owner grant: no.

`#s=menu` draws the link menu in Today, Whole line and Copy beside only: in Order slip the header id is not a link.

## Self-review

- Verdict per screen (skill `design-review` terms): Tally copy lines, native in all three options; Packages header, native; Order slip sheet, native (sheet, Done trailing, list of actions). The Copy pill and the docket are custom marks in the app's own MiniLabel and stamp vocabulary, not stock iOS controls.
- Mockup set structure (design-review terms): Whole line `same`, Copy beside `same` (today's views, tabs and first screen; only the order line changes). Order slip `new`: it adds a view (the slip, a sheet folded and the right page open) and a new way from a Tally copy to its order. Each is `native`, by the line above.
- `check_ios_mockup.py`: safe area and both Duo frames pass. It faults Cochin: a possible false alarm, since Cochin is the app's ruled content face (`typography-cochin-and-mono`, `Font.cochin` in `Theme.swift`), and the page's own chrome uses the system font. The repo's earlier mockup `orphaned-meta-line-wraps.html` faults the same way.
- `label_once.py` on the rendered DOM of Copy beside and Order slip: no hit.
