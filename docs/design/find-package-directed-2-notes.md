# Find the package, directed designer 2: notes

Mockup: `docs/design/find-package-directed-2.html`. Open it from disk. It needs no server and no network.

Designer kind: directed. Direction: grouped scanning. No typing. Group and filter by seller, state and date, so the eye finds the package.

Base: origin/main at d13cf0b1, plus PR 238 (the step 8 Find pill and View group PR, branch `origin/step8-build` at daca959f) for the Find pill and its band.

## Deep links

Join keys with `&`, for example `#c=week-ruler&d=duo&s=picked&t=dark`. With no hash, every concept and every device shows.

- Concept: `c=pigeonholes`, `c=week-ruler`, `c=thumb-index`.
- Device: `d=fold` (the folded Duo), `d=ax5` (the folded Duo at AX5), `d=duo` (the open Duo), `d=pro` (the iPhone 18 Pro).
- State: `s=rest`, `s=picked` (the sample envelope in hand, Gilded Owl, is open), `s=filtered`, `s=empty` (a filter leaves nothing), `s=find` (the Find pill is open with a query).
- Theme: `t=light`, `t=dark`. The dark theme is a spec only: the native app ships light (`UIUserInterfaceStyle: Light`).
- Holes: `o=owed` (the default), `o=every` (item 12).
- Hide controls: "Hide Pigeonholes", "Hide Week Ruler", "Hide Thumb Index" and "Hide tags". Each press removes one thing.
- Focus ids for the waiting page: `focus-pigeonholes` (the hole grid), `focus-week-ruler` (the ruler), `focus-thumb-index` (the tray). Each id is on the folded Duo frame.

## Frames

- iPhone Duo, folded: 466 x 678 pt (from the brief). The system tab bar is 83 pt at the foot.
- iPhone Duo, folded, at AX5: the same frame. Each content size is multiplied by 53/17. That is the AX5 Body size over the Large Body size on Apple's typography page. The app sets Cochin and Menlo with `relativeTo: .body`, so this ratio is a reading of the code, not a measurement.
- iPhone Duo, open: 951 x 669 pt. The fold runs from x 455.5 to x 495.5. Each page is its own clipped box, so nothing crosses the fold. The custom Duo bar sits under the right page (`DuoBarMetrics`, 64 pt plus 12 pt).
- iPhone 18 Pro: 402 x 874 pt. That size comes from a UI test log, as the step 8 notes say.
- `layout.py devices` prints `unknown` for this repo, so the sizes come from the brief and the records. The top safe areas, 20 pt and 54 pt, are the step 8 notes' guesses. Nobody has measured them.

## Sources

- Code: `native/Manifest/PackagesView.swift` (`PackagesView.body`, `PackageRow.header`, `statusSlot`, `bulkRow`, `lines`). On `origin/step8-build`: `native/Manifest/FindPill.swift` (`FindPill`, `View.findPill`, `findPillOnDuo`, `FindPillMetrics`). Paints: `PackageCard.token` in ManifestKit.
- Records: `packages-group-by-order-seller`, `search-filters-inside-package`, `date-filter-spans-ledger-views`, `package-sort-swaps-with-view`, `stamped-filter-on-the-pipeline`, `ruled-head-showing-unreceived`, `ledger-tab-holds-options`, `lost-mail-flags-use-order-date`, `typography-cochin-and-mono`, `design-parchment-ledger`, `duo-card-in-hand`, `no-layout-shift-under-pointer`. Debts: `native-filters-tally-only`, `native-ledger-tab-unbuilt`.
- Step 8 notes on `origin/step8-build`, items 1, 16 and 17 (the pill, its fill and the band).
- Tokens: `shared/tokens.json`.
- Apple pages, read 2026-11-21 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`. Each answered 200.
  - accessibility: the default control is 44x44 pt and the least is 28x28 pt. The default text is 17 pt and the least is 11 pt.
  - typography: Body is 17 pt at Large and 53 pt at AX5.
  - segmented-controls: on iPhone, use no more than about five segments. Use nouns for segment labels.
  - lists-and-tables: avoid a section index on a table whose rows have trailing controls. That is why no concept has an A to Z rail: the status pill sits at each row's trailing edge.
  - menus: use title-style capitalization, and list the frequent items first.
  - tab-bars: a tab bar is for navigation, not for actions.
  - layout, search-fields and buttons were read as well. No number drawn here comes from them.

## Items

1. **Pigeonholes.** New. This is my pick.
   - What: Packages opens on a grid of sellers, A to Z. Each hole shows the seller, the number of packages that seller still owes, and a small box per package: plain for nothing in, manila for some in, an amber or red edge when it is late. A tap on a hole pushes that seller's page, with a back control (All Sellers), a seller head and today's cards for that seller, newest first. The band holds the Ordered age row. The folded Duo shows 3 holes a row and the 18 Pro shows 2. On the open Duo, the holes sit on the left page and the picked seller's cards sit on the right.
   - Gain: the seller's name is the one thing every envelope carries, so the common case is one tap from envelope to cards. A seller keeps its place in the alphabet.
   - Loss: an envelope with no legible sender gets no help. With about 120 sellers owing, the grid runs to about 40 rows on the folded Duo, so it leans on the age row. The boxes are a new code with no key on screen.
   - Departs from: `PackagesView.body` (one `LazyVStack` of `PackageRow` cards, newest first). The first screen of Packages changes.
   - Owner grant: yes.

2. **Week Ruler.** New. This is the runner-up.
   - What: Packages becomes a list of slips, one line per package: a state box, the seller, the card names, the "N left" pill and the age. The slips sit under sticky "Week of" heads, newest first. A head past 14 days carries an amber dot and "over 2 wk", and a head past 30 days carries a red dot and "over 30 d". The band holds a ruler of order weeks. Each mark is as tall as that week's count of open packages. A tap jumps the list to that week, and scrolling moves the mark. A tap on a slip opens it in place into today's card. A tap on the card's head closes it. On the open Duo, the tapped slip takes an accent bar and its card opens on the right page, so the list never moves.
   - Gain: time shows at a glance and the late weeks stand out. The ruler only moves the list, so no row is hidden. This is the smallest departure of the three.
   - Loss: finding a package takes two looks, the week and then the seller. A slip shows only the first card names.
   - Departs from: `PackageRow`, which always draws the full card. The web card expands and collapses (`packages-group-by-order-seller`), so the slip follows the web.
   - Owner grant: yes.

3. **Thumb Index.** New.
   - What: the band is a tray with a fit count ("7 of 38 fit") and Clear, then three rows. The rows are the seller initials in six ranges (A–C to T–Z), the order's age (Any, under 2 weeks, 2 to 4 weeks, 30 days or more) and the state (Any, Nothing in, Some in). Each tab shows how many packages it would leave, and a tab that leaves none is off. A second tap on an initials tab lifts it. Slips fill the list, as in item 2. On the open Duo, the left page is a sorting desk with one key per initial and the right page holds the matches.
   - Gain: it works from any clue, and it uses all three keys of the direction.
   - Loss: the tray is about 190 pt tall on one page (about 280 pt with the tab bar under it), so at rest the folded Duo shows about three slips below the masthead. The initials row has six tabs, one more than Apple's "about five" for iPhone. Three filters that hide rows are more to undo.
   - Owner grant: yes.

4. **The band.** Waiting page item 95 is open, so the band is drawn here.
   - What: one band for all three concepts. It is solid paper with a 1 pt `line` rule on top, it sits above the tab bar, and the list ends at its rule. That is the band that PR 238 built (`View.findPill`), with the fill the brief gives as item 101 a. The band holds the concept's control. Find becomes a 44 pt key at the band's end. The key opens today's pill, with Clear and Done. The pill searches card, set, seller and order, as built.
   - Gain: the thumb reaches the scanning control (`ux-thumb-zone`), and typing stays one tap away for an order number.
   - Loss: on one page, Find costs one more tap than the built pill.
   - Departs from: `FindPill` on `origin/step8-build`, which always shows the pill, and `phone-nav-is-bottom-bar`, section Find, which has a floating pill. On the open Duo the key sits on the left page's band. Today `findPillOnDuo` puts the pill on the right page.
   - Owner grant: yes.
   - The brief cites item 101 a in `duo-card-in-hand`. I found no item 101 in that record or anywhere on main at d13cf0b1.

5. **Filters on the working screen.**
   - What: Pigeonholes puts the Ordered age row on Packages, and Thumb Index puts three filter rows there. Week Ruler adds no filter: its ruler is navigation.
   - Departs from: `ledger-tab-holds-options` ("The working screens hold no option rows", owner 2026-10-11) and item 47 a (the head cells live in the Ledger tab's View group). Orders from stays in the Ledger tab. The age row is a second date control beside it, and the two stack.
   - Owner grant: yes.

6. **Late tiers at 14 and 30 days.**
   - What: the holes, the ruler marks and the week heads use amber from 14 days and red from 30 days, counted from the order date (`lost-mail-flags-use-order-date`, `lostMail`). The native card has no lost-mail flag yet (debt `native-card-lost-flags-unbuilt`).
   - Builder note: a stamped package hides its flag (`stamped-package-hides-lost-flag`), and `lostMail` skips tracked packages. The sample has no stamps and no tracked packages, so the mockup does not draw either case.
   - Owner grant: no. It follows the web rule.

7. **Package state as the line's check box.**
   - What: a package's state is drawn as the line check box of the card (`PackageCard.token`, `boxBorder` and `boxFill`): plain for nothing in, manila with a dash for some in, and green for all in. One icon keeps one meaning (`ux-one-plain-name`). "All in" is not a filter here, because Showing in the Ledger tab still governs it (`ruled-head-showing-unreceived`).
   - Owner grant: no.

8. **The seller page heads each card by its date.**
   - What: under the seller head, each card shows "Ordered 2026-11-11" and its age in place of the seller, so the seller shows once (`ux-label-once`).
   - Departs from: `PackageRow.header`, which shows the seller on every card. Not blocking.
   - Owner grant: no.

9. **Nothing moves under the finger.**
   - What: a package ticked to done stays in view until a filter changes, as a sticky row (`no-layout-shift-under-pointer`). An opened slip never closes by itself. On the open Duo, a tap fills the right page and leaves the left list still.
   - Owner grant: no.

10. **The open Duo uses both pages.**
    - What: each concept puts a list beside its detail, which is the layout page's size-class rule. The Card in Hand control (Today) sits at the top of the left page, or of the right page in Thumb Index.
    - Departs from: `duo-card-in-hand`, Defaults: "Packages does not spread on the open Duo", and the Card in Hand control "covers both pages". Both are defaults, not owner rulings. Not blocking.
    - Owner grant: no.

11. **AX5 on the folded Duo.**
    - What: holes become one full-width row each, and the boxes drop out. The age row becomes one row button that opens a list (Apple menus). The ruler drops its bars and scrolls sideways, and each mark shows a date and a count. The Thumb Index tray folds into one "Narrow" row that opens all three lists.
    - Loss: today's masthead fills the first screen at AX5, so the list starts below the fold (debt `native-masthead-axl-clips`; the step 8 branch adds a second debt, masthead-at-ax-sizes). It is drawn to fit, not measured.
    - Owner grant: no.

12. **Holes for sellers owing, or for every seller.**
    - What: "Sellers owing" shows only sellers with an open package. "Every seller" keeps a dashed hole for each seller, so a seller never moves.
    - Pick: Sellers owing. With hundreds of sellers, empty holes bury the ones that matter.
    - Owner grant: no.

13. **Sort.**
    - What: the Pigeonholes grid runs A to Z and the Week Ruler runs by date. So Sorted by (`package-sort-swaps-with-view`: newest, oldest, $ remaining, unit rate, seller A to Z) changes only the order inside a seller page. In Week Ruler and in Pigeonholes' grid, Sorted by would change nothing, so `ux-control-earns-place` asks for it to hide there or to sort inside each group.
    - Owner grant: yes. It changes what a ruled control does.

14. **Type floor.**
    - What: the ruled cells and the mono labels are drawn at 11 pt. The build draws some at 10 pt. This is step 8 notes item 13, which still waits for the owner.
    - Owner grant: no. That item carries its own grant.

## Self-check (skill design-review, applied to my own mockup)

- I spawned no reviewers, because a designer cannot spawn. These are my own reads of the frames in headless Chrome, at every size I drew, in light and in dark.
- Mockup set check: all three concepts are `new`. Each changes the first screen of Packages, as a seller grid or as slips with a band control.
- Native or web-like, per frame:
  - Pigeonholes: native. It is a grid of buttons with a push and a back control, as in a navigation stack.
  - Week Ruler: native. It is a list with sticky section heads. The ruler is a custom control, like a Health chart's bars.
  - Thumb Index: web-like risk. Its six-tab strip is a custom control with more segments than Apple's iPhone advice.
- Verdicts, folded Duo, 18 Pro and open Duo, light and dark: all three concepts pass, with Thumb Index's issue above. AX5: Pigeonholes and Week Ruler pass, with the masthead loss. Thumb Index passes only after the fix below.
- `check_ios_mockup.py`: one fault, `system-font: a font declaration starts with cochin`. Cochin is the app's content font (`typography-cochin-and-mono`). The page chrome and the system bars use the system font. The Duo mockups on main fail the same way, so this may be a false alarm.
- `label_once.py`, run on the rendered folded frames: "llanowar elves" shows twice and "stamp" shows three times. The first is data, two packages that hold that card. The second is today's Stamp control, one per card.
- Tap targets: a Playwright pass found no control in a frame under 44 pt, except the Find field's text box. The whole 48 pt pill takes that tap, as built.

## Critique

The critique ran with skill `impeccable` on 2026-11-21. The method was a design review only, because the target is a native screen, so it ran no detector and wrote no snapshot. The launcher was not used. No PRODUCT.md and no DESIGN.md exist.

- Heuristics, out of 40: visibility of system status 3, real world 4, user control 3, consistency 3, error prevention 3, recognition 3, efficiency 3, minimalism 3, recovery 3, help 2. The total is 30.
- Fixed:
  - At AX5, the Thumb Index tray filled the screen. It now folds into one Narrow row.
  - "0 d" on a slip now reads "today".
  - The week head's bare count now has a spoken label.
  - The seller page said the seller on every card. It now says it once.
  - Picked opened at the week head, not at the card. It now opens at the card.
  - The ruler opened on the oldest weeks. It now opens on the newest.
  - Clear was 41 pt wide. It is now 44 pt.
- Not fixed, and why:
  - The Thumb Index tray is tall on one page. That is the concept's cost, so it is drawn as it is.
  - The hole boxes have no key on screen. They reuse the check box and tier colours.
  - The dashed tags cover some text. "Hide tags" removes them.

## Input Needed

- Items 1 to 5 and 13 carry `Owner grant: yes`.
- Pick one concept, or keep a part of one, such as the Week Ruler's slips under Pigeonholes' seller page.
- Should a filter row live on Packages at all, given `ledger-tab-holds-options`?
- Should the Find pill fold into a key, which is item 95's question in another form?
