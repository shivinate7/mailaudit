# Panels over the ledger: notes

Mockup: `panels-overlay-informed-1.html`. Designer kind: informed. Designer `panels-overlay-informed-1`.
Rulings kept: `motion-disclosure-panels-arrive` (panels overlay the list, owner 2026-10-11), `head-panels-carry-paper-fill` (paper fill, owner item 63 a for Sorted by and History), `history-sync-close-each-other` (one panel open at a time), `motion-nothing-may-reflow`, `ledger-tab-holds-options`, `ruled-head-range-picked`, `armed-reset-takes-the-row`, invariants `no-layout-shift-under-pointer` and `no-native-dialogs`. Debts it answers: `panels-overlay-unbuilt`, `panel-paper-fill-unbuilt`.

## The pain

"Everything jumps when I open a menu." Today every panel mounts in flow and pushes the rows under it. Native: `LedgerTab.syncRow` and `LedgerTab.history` (`native/Manifest/LedgerTab.swift`) put the panel inside the Data card. Web: `panelWrap` callers in `src/app.jsx` (Sorted by, Orders from, Sync, Recent, History). The Today frame measures it live: opening Sorted by on the folded Duo drops Orders from by 161 pt.

## Deep links

`#c=today|laid|dock` for one concept, `d=folded|open|phone|ax5` for one device, `p=sort|range|history|sync` for the open panel (`p=` opens none). `k=0` hides the Today/New tags, `v=1` turns the veil on, `e=square` squares the sheet's corners, `hide=laid,dock,today` hides concepts. Example: `#c=dock&d=open&p=history`. Each frame is live: tap rows, pick, tap outside, swipe the dock down, press Escape. Under each frame a line reads how far any row moved on the last tap.

Focus ids for the waiting page: `focus-laid` (Laid sheet), `focus-dock` (Facing page). Each shows its own concept in its own state.

## Sizes and sources

- `layout.py devices` says `unknown` for this repo. The Duo is drawn at the brief's sizes: folded 466 x 678 pt; open 951 x 669 pt with the fold from x 455.5 to 495.5 (the same as `duo-fold-and-keyboard`). Nothing sits across the fold.
- Large phone: no size is written in the repo, the layout file or the brief. It is drawn at 375 x 812, the one phone size the repo writes (`WIDTHS` and `openSeeded` in `test/screens.mjs`). Both concepts are fluid in width, so a wider phone only adds side room. Unmeasured.
- Status bar foot: unmeasured; drawn at the 20 pt floor of `DuoHandUITests.statusBarFloor`. Tab bar with the home indicator band: drawn 64 pt, not measured.
- Theme: one, light. The native app is held to light (`design-parchment-ledger`); the dark keys in `shared/tokens.json` are the extension's only.
- Tokens: `shared/tokens.json`. Type: Cochin for words, Menlo for numbers (`typography-cochin-and-mono`); sizes from `LedgerTab.swift` (`LedgerRow` 20/13.5/14, `partRow` 10/11, `versionRow` 11/14/10.5). Vocabularies from `src/app.jsx` `PKG_SORTS` and `RANGES`. Restore wording from `VersionNotice.restoreAsk`.
- AX5 sizes: each code size times the AX5-to-Large ratio of the text style it is `relativeTo` (Title 3 20 to 55, Footnote 13 to 44, Callout 16 to 51, Caption 1 12 to 43, Caption 2 11 to 40, Body 17 to 53).
- Apple pages read 2026-11-21, each answered 200: Layout (safe areas; lay out by size class; its device-size table is not in the page data, so no phone size came from it), Typography (Dynamic Type tables, Large and AX5), Accessibility (44x44 pt default control, 4.5:1 contrast, text to 200 percent), Buttons (44x44 pt hit region), Sheets (swipe to dismiss, grabber, Done paired with a way out), Popovers (closes on a tap outside or on a pick), Menus.
- Sample: every figure, date, count and version is sample.

## Items

1. **Laid sheet** (concept, `#c=laid`). The panel is a sheet of paper laid over the rows, hanging from the row tapped, as wide as its card. Paper fill, line border, 8 pt foot corners, a `shadow`-token edge.
   - Gain: the smallest step from the ruling. The panel sits where the eye already is, next to its row (house `ux-control-beside-area`, `ux-answer-at-press`). Same shape on web and native, so one build covers both.
   - Loss: it covers the rows below it while open (Orders from and the Sync row under Sorted by). Its position must be computed from the row and the space left, which is one more moving part to test.
   - Pick: yes, as the safe choice. Owner grant: no (it is the ruling, built).

2. **Facing page** (bold concept, `#c=dock`). One screen: the panel docks above the tab bar, with a grabber, its row's name and Done. Two pages: the right page becomes the open panel and the left page is never covered.
   - Gain: on one screen the choices sit in the thumb zone of a one-hand phone (house `ux-thumb-zone`), and one swipe down closes it, as iOS sheets do (Sheets page). On the open Duo nothing overlays at all, which is the strongest answer to "everything jumps". Tapping another row swaps the right page in place.
   - Loss: on one screen the panel is far from its row; the open row carries an accent bar to tie them. A tall panel (History) covers the whole Data group. It is a dock, not a system `.sheet`: a system sheet slides the full height, which breaks the 4 pt arrival, so this needs a custom view.
   - Pick: yes on the open Duo, either on one screen. Departs from: `motion-disclosure-panels-arrive` says "overlays the list"; on two pages the panel sits beside it instead. Not blocking. Owner grant: yes.

3. **One gesture closes** (both concepts). A tap anywhere outside the panel closes it, and that tap reaches no row. So a tap meant to close never presses Reset or Backup under it. Also: the row again, Done (dock), swipe down (dock), Escape. A pick closes Sorted by, as `src/app.jsx` does today (`setSortOpen(false)`); Orders from stays open, because Last… and By month ask for more.
   - Gain: one gesture, and no stray press. Matches the Popovers page.
   - Loss: with a panel open, the first tap on another row only closes; a second tap opens it. On the open Duo, Facing page has no such cost.
   - Pick: yes. Owner grant: no.

4. **Hang upward near the bottom** (Laid sheet). When the space under the row is short and the space above is larger, the sheet hangs above the row instead. History on the folded Duo does this; so does every low row at AX5.
   - Gain: the row tapped stays in sight, and the list is never scrolled to make room (a scroll is a move).
   - Loss: the sheet then covers rows above, and its side flips with the row's place.
   - Pick: yes. Owner grant: no.

5. **Height cap and inner scroll** (both). A panel never runs under the tab bar; a long one (History, By month with Exact dates) scrolls inside itself, with `overscroll-behavior: contain`.
   - Gain: nothing outside the panel ever has to move to fit it.
   - Loss: a version can sit below the fold of the panel.
   - Pick: yes. Owner grant: no.

6. **Ledger on two pages** (open Duo). Laid sheet: View on the left page, Data and Reset on the right. Facing page: all rows left, the panel right.
   - Gain: nothing sits across the fold. Today the Ledger tab does not spread (`DuoSpread.spreads(tab:)` returns false for `.ledger` in ManifestKit), so its one page runs across the 40 pt fold.
   - Loss: one more spread to build and test.
   - Departs from: `DuoSpread.spreads(tab:)` (`.ledger` is false). Not blocking. Owner grant: yes.

7. **The open edge** (`head-panels-carry-paper-fill`, The open edge question). Rounded foot corners with a faint shadow by default; `e=square` shows square corners.
   - Gain (rounded): the sheet reads as paper laid on the card, and no square, full-bleed band sits in a region of rounded cards.
   - Loss: a shadow is new to the Ledger tab; it uses the `shadow` token only.
   - Pick: rounded. Owner grant: yes (the record leaves the edge to the owner).

8. **Veil** (Laid sheet, off by default, `v=1`). Paper at 45% over everything but the sheet.
   - Gain: it says the rows are asleep until the sheet closes.
   - Loss: it also dims the row tapped, and the register is stationery, not software (`motion-stationery-not-software`).
   - Pick: no. Owner grant: yes, if chosen.

9. **Accessibility text** (AX5 frames). Rows stack title over value, as `versionRow` already does at accessibility sizes. Option grids fall to one column. The dock may grow to 78% of the screen.
   - Gain: no text is cut at AX5.
   - Loss: `LedgerRow` gains a stacked layout it lacks today.
   - Departs from: `LedgerRow` in `LedgerTab.swift` (an HStack at every size). Not blocking. Owner grant: no.

10. **Native View group.** Showing, Sorted by and Orders from are drawn on the native Ledger tab, as the web has them (`ledger-tab-holds-options`). Native has no View group yet: Tally keeps a system `Menu` for sort on its working screen (`TallyView.sortMenu`) "until the Ledger tab's View group lands". The panels here are drawn for when it lands. Owner grant: no.

11. **Option cells are 44 pt** on native (web `CTL_H` is 34). Apple's 44x44 pt hit region. Owner grant: no.

## Considered, not drawn

- A system `Menu` for Sorted by: it overlays and closes on a tap outside, but it paints system material, not paper (item 63 a), and cannot hold the date range. Not drawn.
- A system `.sheet` with detents: it slides the full screen height, not a 4 pt move (`motion-disclosure-panels-arrive`). Facing page keeps the sheet's gestures with the ruled arrival.

## Notes for the builder

- The check the ruling names: with a panel open and closed, every row's top is equal. The live readout under each frame is that check in the mockup.
- Native: an overlay is `.overlay(alignment:)` on the card's container, or a `ZStack` above the scroll content, never an `if open { panel }` inside the `VStack`. The tap catcher is a clear full-screen layer under the panel that closes it.
- `.mdl-lcard` needs `overflow: visible` on the web for a sheet that runs past its card (see `panel-paper-fill-notes`).

## Critique (impeccable)

Single context: a designer has no sub-agent tool. The launcher's context step was skipped; the repo has no PRODUCT.md or DESIGN.md. No snapshot was written. The live overlay was not run; the page was inspected through headless Chromium shots and scripted taps.

- Fixed: the dock was laid out at the top of the screen, because the tag rule's `position: relative` beat `.dock`. The tag rule now has no weight.
- Fixed: rows behind a laid sheet or the dock could still take keyboard focus. They are now inert; the open row stays live, as it closes the panel.
- Fixed: at AX5 a row's title and value overlapped. Rows and versions now stack.
- Fixed: the masthead and sheet tags were clipped by the frame edge.
- Fixed: the Today panel drew a paper fill; today's panels paint none.
- False alarm (detector): "cream palette". The parchment page is the repo's palette (`design-parchment-ledger`).
- Open: with a panel open on one screen, the first tap on another row only closes (item 3). The veil (item 8) is the drawn answer; the owner picks.
- Open: the iOS mockup check faults Cochin, as on every earlier mockup here. Cochin is ruled for words (`typography-cochin-and-mono`); the chrome is the system font.

## Design review, self-check (skill design-review)

No reviewers spawned: a designer cannot spawn. These are my own lines, for the design reviewer to check.

- Structure: Laid sheet `same` on one screen (same tab, rows and first screen; only the panel's place changes), `new` on the open Duo (two pages). Facing page `new` (a dock on one screen; a list-and-panel spread on two pages).
- Laid sheet: `web-like`. A popover anchored under a row is a web and iPad pattern; on iPhone a popover presents as a sheet (Popovers page). Its strength is parity with the web build.
- Facing page: `native`. A bottom panel with a grabber, Done and swipe down, and on two pages a list beside its detail (Layout page, by size class).
- Label once (`ux-label-once`): `label_once.py` reads only static HTML and found nothing; the frames are drawn by script. By hand: Facing page repeats the row's name ("Sorted by") as the dock's title. Kept, because the dock sits far from its row; a sheet names its task. Owner grant: no.

## Input needed

- Owner grants: items 2 (Facing page departs from "overlays" on two pages), 6 (Ledger spreads on the open Duo), 7 (the open edge), 8 (veil, if chosen).
- The large phone's size is written nowhere. Drawn at 375 x 812.
- Does the owner want the first tap on a covered row to close and open in one tap (no catch layer), at the risk of a stray press on Reset?
