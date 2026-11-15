# Step 8: Find pill, filters and sort: notes

Mockup: `docs/design/step8-packages-tally-filters.html`. Open it from disk. Deep links: `#s=folded`, `#s=packages`, `#s=typed`, `#s=empty`, `#s=tally`, `#s=tally-empty`, `#s=filters`, `#s=sort`, `#s=sort-tally`, `#s=duo-tally`, `#s=duo-packages`, `#s=duo-hand`. With no hash, every frame shows. The buttons "Hide Title Case labels", "Hide the 11 pt floor" and "Hide tags" each remove one option or the tags.

Designer kind: informed.

This is a redraw, not the original. The step 8 design spec and its packages-tally-filters mockup were lost: they lived only in the coordinator's Mac side-session notes (PR 238, the step 8 search pill, filters and sort PR, "Owed before this can merge", item 2). This page is drawn from the built code on `step8-build` at 6a4a900. Items 1, 4, 9 and 12 follow `step8-design-fix` at ea8d8ff0 (the step 8 design-fix commit). Where the build is the only source, the mockup draws the build. It does not claim to match the lost original. Each place that needed a guess is listed under Guesses.

## Sources, in order

1. PR 238's description, read 2026-11-15 with the GitHub MCP, and the code on `origin/step8-build`: `native/Manifest/FindPill.swift`, `PackagesView.swift`, `TallyView.swift`, `LedgerTab.swift`, `OptionPanel.swift`, `StampViews.swift` (`RuledRow`), `BulkViews.swift`, `HandScreen.swift` (`PackagesTab`), `DuoSpine.swift` (`DuoBarMetrics`, `DuoBar`), and `src/view-rules.mjs` (`RANGES`, `PKG_SORTS`, `rangeLabel`, `monthChoices`, `refundedPill`).
2. The restyle plan. `origin/rw/restyle-plan` holds it in `decisions/native-build-lanes.md`, "After N11", and main holds the same text in `docs/decisions/native-build-lanes.md`. No step there is numbered 8. Lane N21 ("the ruled head cells, the floating search pill, and the Packages filters; closes `native-filters-tally-only`") matches step 8's contents. See Guesses.
3. `docs/design/duo-hand-gaps-notes.md` on `origin/main`, rulings 77 a, 81 b and 76 a. Only 81 b applies to a step 8 screen (item 12).
4. The web reference, `src/app.jsx`: `.mdl-pill` (CSS), the pill markup with placeholder "Find card, set, seller, order", and `MailDayLedger`'s empty list with "Clear search" (`setQuery("")`).

## Frame

- Three sizes, light theme only. The native app is held to light (`UIUserInterfaceStyle: Light`, decision `native-build-lanes`, N13 notes).
  - iPhone Duo folded: the outer screen, 466 x 678 pt. The system tab bar starts at y 595 pt and is 83 pt tall (`duo-fold-and-keyboard`, re-measured 2026-11-08).
  - iPhone 18 Pro: 402 x 874 pt. The system tab bar starts at y 791 pt and is 83 pt tall (`FindPillUITests.testPillAboveTheBarIsNotSkippedAsUnderTheBar`, sim log of 2026-11-08).
  - iPhone Duo open: 951 x 669 pt. The fold is 40 pt wide, at 455.5 to 495.5 pt (`duo-fold-and-keyboard`).
- `python3 ~/.claude/lint/layout.py devices <repo>` prints `unknown` for this repo, so the sizes come from the records and the test above, not from a device list.
- Tokens come from `shared/tokens.json`. Cochin sets words and Menlo sets numbers (`typography-cochin-and-mono`). The system font sets page chrome and the iOS status and tab bars only.
- Apple pages read 2026-11-15 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`. Each answered.
  - accessibility: on iOS, controls are 44x44 pt by default and 28x28 pt at the least. Text is 17 pt by default and 11 pt at the least. Text should scale to at least 200 percent.
  - buttons: a hit region is at least 44x44 pt. Labels use title-style capitalization.
  - layout: respect the safe areas, and lay out by size class, not by device.
  - typography: default Dynamic Type sizes are Body 17, Footnote 13, Caption 1 12 and Caption 2 11.
  - search-fields: placeholder text names what search covers. A search field holds a Search icon, a Clear button and the placeholder. On iOS, search may sit at the bottom "if there's room".
- `check_ios_mockup.py` result: one fault, `system-font: a font declaration starts with cochin`. The system font, safe-area and Duo frame checks all pass. Cochin is the app's content font (`typography-cochin-and-mono`). The check refuses any first family that is not a system font. The two Duo mockups on main, `duo-hand-post-sender.html` and `duo-hand-gaps.html`, fail it the same way. This may be a false alarm; see the report.

## Items

1. **The Find pill, one page.** Today, built.
   - What: a glass capsule pinned above the system tab bar on Packages and on Tally. It holds a magnifier, a Cochin 16 field, and a 44 x 44 pt clear slot. The placeholder is "Find card, set, seller, order" at normal type sizes, and "Find" at accessibility sizes, where the full prompt was cut off (`FindPill.promptText`). It sits 16 pt in from each side and 8 pt above the bar. It draws only while the ledger holds items. One query serves both tabs.
   - Sources: `FindPill`, `View.findPill(show:query:change:)`, `PackagesView.pillShown`, `TallyView.findPillShown`; web `.mdl-pill`.
   - Gain: the main input sits in thumb reach (`ux-thumb-zone`), and Apple's search-fields page allows bottom placement. Loss: it covers the last 68 pt of list at rest at normal type sizes (48 pt pill, 8 pt above and below). At accessibility sizes the field holds one line (`FindPill.fieldLines`) and the pill follows the text. Before that fix, an empty second line made it 87 pt tall at AX3 and 110 pt at AX5 (design review, screen-check run 43765127724), and it hid "14 still missing" and the VALUE figure. A bottom content inset scrolls the list clear.
   - Pick: as built.
   - Tests: `FindPillUITests.testPillSitsAboveTheTabBarOnPackagesAndTally`, `testFindFieldHitAreaIsAtLeast44ptTall`, `testOpeningSearchMovesNoPackageRow`, `testPillAboveTheBarIsNotSkippedAsUnderTheBar`. No test reads either placeholder.

2. **The clear button (x).** Today, built. Owner item 46 a, 2026-11-08 10:55 CST.
   - What: a 20 pt inkSoft disc with a paper x, centred in a 44 x 44 pt button labelled "Clear search". It shows only while the field holds text. While the field is empty, a clear spacer of the same size holds its slot, so the field keeps its width when the first letter lands (`no-layout-shift-under-pointer`).
   - Sources: `FindPill.clearSlot`. It does what the web's "Clear search" does: `setQuery("")` in `src/app.jsx` `MailDayLedger`.
   - Departs from: the web `.mdl-pill`, which has no clear control. The owner granted the departure (item 46 a).
   - Test: `FindPillUITests.testPillClearButtonShowsOnlyWithAQueryAndClearsIt`.

3. **The typed state and the way back.** Today, built.
   - What: a query keeps the packages with a match. A card shows only its matching lines, then a 44 pt footer: "+N more lines in this order show all", or "Showing the whole order back to matches" (`search-filters-inside-package`).
   - Sources: `PackageRow.revealFooter`, `PackagesModel.setQuery`. A query typed during a reload keeps its rows (`filterEpoch`).
   - Tests: `FindPillUITests.testPillFiltersThePackagesList`; `PackagesReloadRaceTests` in ManifestKit.

4. **The empty result.** Today, built.
   - What: one sentence and one control (`ux-unknown-is-not-empty`). On Packages: "No cards match that search." with Clear Search. On Tally: "No items match that search." with Clear Search. With no query, the control is absent, and the sentence reads "Everything here has been checked in." (Packages) or "Nothing to show." (Tally). The ruled row stays.
   - Sources: `PackagesView.empty`, `TallyView.empty`.
   - Test: no case taps `package-clear` or `tally-clear`. That gap is a test to add: type a query that matches nothing, check that the sentence and Clear Search show, tap it, and check that the rows return.

5. **Filters: Showing and Orders from.** Today, built. Owner item 47 a: the head cells live in the Ledger tab's View group.
   - What: the filters live in the Ledger tab's View group, above Data, not on Packages or Tally. Showing is one tap (○ Everything, ● Unreceived). Orders from has a sub line ("N lines · N outside") and opens a 4-column grid of the `RANGES` presets: All time, 30, 45, 60 and 90 days, Last…, By month.
     - Last… adds a − / + day stepper.
     - By month adds the month chips, newest first, and an Exact Dates disclosure with From and To date pickers.
     - A whole-month range reads back as its month, such as "Aug". The year shows only when the ledger spans more than one year.
   - Sources: `LedgerTab.viewGroup`, `LedgerTab.monthRow`, `LedgerTab.daysRow`, `OptionPanel`, `OptionChip`; `view-rules.mjs` `RANGES`, `rangeLabel`, `monthChoices`, `bumpDays`.
   - Tests: `LedgerViewUITests.testLedgerTabHoldsTheViewGroupAboveData`, `testPickingAnOrderChangesThePackagesList`; `ViewOptionsModelTests.testSavedOrdersFromRangeNarrowsThePackagesList`, `testSavedOrdersFromRangeChangesTallyCounts`, `testPickingAWholeMonthReadsBackAsItsName`; `test/view-rules.test.mjs`.

6. **Sort.** Today, built.
   - What: Sorted by opens a 2-column grid. It holds the Packages keys (`PKG_SORTS`: Newest, Oldest, $ remaining, Unit rate, Seller A–Z) or the Tally keys (`TallySort`: Most missing, Cost basis, Most ordered, $ remaining, Unit rate, Name A–Z). Which set shows follows the list tab you left last (`options.lastList`). The last cell of an unfinished row spans the row.
     - A pick closes the grid.
     - Sorted by and Orders from close each other.
     - The sort runs in the JS bundle (`rules-run-in-javascriptcore`). A reload keeps the order while the source and the sort are unchanged.
   - Sources: `LedgerTab.viewGroup`, `ViewOptions.packageSorts`, `TallySort.label`, `RootView` `onChange(of: tab)`.
   - Tests: `ViewOptionsModelTests.testSavedSortByOrdersThePackagesList`, `testSavedItemSortSetsTheTallySort`; `TallyUITests.testEverySortLabelFitsAt375pt`. Debt `tally-reorders-on-reload` holds the known gap.

7. **The ruled row on Packages.** Today, built.
   - What: a rule, a row of 44 pt cells at the trailing edge, and a thin rule. The cells are "N canceled ▸", a disclosure shown only while a canceled order exists, and "N stamped ○/●", a filter. Packages always draws the row, so the first stamp does not push the list down. Tally draws it only while a canceled order exists.
   - Sources: `RuledRow`, `PackagesView.canceledCell`, `TallyView.canceledRow`.
   - Test: PR 238 names `PackageCardUITests`, but no case was read that taps `stamped-cell`.

8. **The refunded pill.** Today, built.
   - What: "N left · refunded" in Cochin 12.5 bold, manilaInk on manila, in the card's status slot. The slot is sized by the widest pill, "99 left · refunded", so a check-in moves nothing. It scales with Dynamic Type.
   - Sources: `PackageRow.statusSlot`; `refundedPill` in `src/view-rules.mjs`.

9. **The Tally empty sentence.** Today, built. It matches the web.
   - What: "No items match that search.", the web's wording in `src/app.jsx` `MailDayLedger`. Source: `TallyView.empty`.
   - Pick: match the web, since a port keeps behaviour (`building-port-keeps-behaviour`). Gain: one sentence on both clients. Loss: "items" is not a word the native Tally uses. Not blocking. Owner grant: no.
   - The other choice kept "product", the Tally's own word (`tally-pools-on-the-exact-name`). It departed from the web with no ruling.

10. **The open Duo.** Today, built. Duo ruling Q5, 2026-11-08 11:14 CST.
    - What: the pill floats over the right page, 16 pt in from its edges. Its bottom sits `DuoBarMetrics.height + 8` = 76 + 8 = 84 pt above the window's bottom, so 8 pt above the Duo's own bar.
      - On Tally, it filters the left page's list. The right page shows the picked name's totals and copies.
      - Packages keeps its one-page list across both pages, with the Card in Hand control at the top.
      - The pill leaves the tree while Card in Hand is open (`duoHandOpen`).
      - The list scrolls clear of the pill and the bar (`FindPillMetrics.duoRoom`).
    - Sources: `View.findPillOnDuo`, `FindPillMetrics`, `DuoBarMetrics`, `TallyView.body` (`DuoPages`), `PackagesTab`.
    - Tests: `FindPillDuoUITests.testFlatDuoPillSitsOnTheRightPageAboveTheBar`, `testFlatDuoPillHidesWhileCardInHandIsOpen`.

11. **The folded Duo.** Today, built.
    - What: one page, so the pill takes the inset form of item 1 above the system bar (`PackagesView.pillShown` is true when `spread.pages(for: .cardInHand)` is nil).
    - Test: none on the folded Duo. That gap is a test to add: fold, open Packages, and check that `find-pill` sits above the tab bar.

12. **Title Case button labels.** Today, built. Ruling 81 b, waiting page item 81, 2026-11-09 19:19 CST.
    - What: the visible button labels on step 8 screens are Title Case. "Clear Search" (both empty states), "Mark All Received", "Clear Check-ins", "Undo Mark All", and "Exact Dates". "Card in Hand" and "Stamp" already comply. The x button's spoken label stays "Clear search" (item 2).
    - Code: `PackagesView.empty`, `TallyView.empty`, `BulkRow.markSlot`, `BulkRow.clearTitle`, and `LedgerTab.monthRow`. Any UI test that finds a button by its label text moves with it.
    - Gain: it follows the ruling and Apple's buttons page. Loss: the web keeps sentence case, so the two clients differ.
    - Pick: applied. Owner grant: no (the ruling exists). The control "Hide Title Case labels" shows the sentence-case labels from before the ruling.

13. **The 11 pt text floor.** New. The brief and Apple's accessibility page set 11 pt as the least text size.
    - What: the build draws these under 11 pt:
      - the ruled row cells: Menlo 10 (`RuledRow.cell`)
      - RECEIVED: Menlo 10.5 (`PackageRow.statusSlot`)
      - the Tally across line: Menlo 10.5 (`TallyRowView.across`)
      - the Tally copy order id: Menlo 10.5 (`ItemLine.orderControl`)
      - the Month, Last and days labels: Cochin 10 (`LedgerTab.subHead`, `daysRow`)
      - CANCELED: Menlo 10 (`CanceledList`)
    - The mockup draws them at 11 pt.
    - Gain: every step 8 string meets Apple's floor at the default size. Loss: the 44 pt ruled cells widen by about a tenth, and the records that hold ruled-head sizes may need re-measuring (`ruled-head-heights`).
    - Pick: apply. Owner grant: yes. It changes the ruled head's measured type, which `ruled-head-masthead-vocabulary` governs. The control "Hide the 11 pt floor" shows the built sizes.

14. **Rulings 77 a and 76 a.** Not on a step 8 screen.
    - Ruling 77 a, the accent bar on the typed card's line, applies to the Card in Hand line only.
    - Ruling 76 a, a Suspense line of several names, applies to Card in Hand only.
    - The Tally cell's 2 pt accent outline on the open Duo (`pickedMark`) is not ruling 77 a. It was built before that ruling.

15. **The sort names the list it sorts.** New, from the critique.
    - What: a sub line under Sorted by, "Packages list" or "Tally list", the list that `options.lastList` names. Today the row gives no sign of which list it sorts. On the Ledger tab, the same row shows five keys or six, depending on which tab you left last.
    - Departs from: `src/app.jsx` `lastList`, where the web's View group shows no such line. Not blocking.
    - Gain: the key set no longer changes with no reason given (`ux-one-plain-name`). Loss: one more line in the View card, and the web differs.
    - Pick: owner's choice. Owner grant: yes, because it adds a line the web lacks. The control "Hide the sort's list name" removes it. Focus: `#focus-scope`.

## Guesses

- **Step number.** The restyle plan on `rw/restyle-plan` has no step numbered 8. Step 8 is read as lane N21 by its contents, and PR 238 calls step 9 motion and step 10 sync labels.
- **The lost mockup's layout.** It is unknown whether the original placed the filters and sort in the Ledger tab's View group, as built, or on the lists. It is also unknown whether it drew the months as chips, and whether it drew the Ledger tab at all.
- **The lost spec's tests.** The test list above names the tests on the branch. The original spec may have named others.
- **The 18 Pro size.** 402 x 874 pt comes from one UI test's logged window, not from a device list or an Apple page.
- **Top safe area.** Drawn at 54 pt on the 18 Pro and 20 pt on the Duo. Neither is measured.
- **Pill height.** Drawn at 52 pt. The code sets a 48 pt minimum with a two-line field, and the sim log read 52 pt.
- **Pill place on the 18 Pro.** Drawn per the code: 16 pt in, 8 pt above the bar. The sim log frame differs: x 77.67, width 279, bottom 779 against a bar at 791, so 12 pt above it. That log was taken at a 375 pt launch width in a 402 pt window. Why the leading inset reads 64 pt is unknown.
- **Keys.** The typed state is drawn with the keys down. The 18 Pro keyboard frame is unmeasured.
- **Masthead.** Drawn short, with sample figures. Its real height and parts are not drawn, because step 8 does not change them.
- **The Duo Packages list across the fold.** Drawn from a code read (`PackagesTab` keeps the one-page layout, and `MastheadScreen` has no `DuoPages`). No screenshot was read.
- **Title Case scope.**
  - The sort and range grid cells are left as built ("All time", "$ remaining"), because they read as values, not acts.
  - The clear button's spoken label "Clear search" is left as built, because the ruling names visible labels.
  - Both are guesses.
- **Card parts.** The Stamp slot, the bulk row order and the line layout are drawn from the code at sample sizes, not from a shot.
- **Duo bar icons.** Drawn as plain boxes, not the SF Symbols the build uses.

## Critique

Run with skill `impeccable` (`critique`) on 2026-11-15. The launcher did not run, and no PRODUCT.md or DESIGN.md exists. The target is a native platform, so the critique was the design review alone, with no detector and no snapshot.

- Fixed: the Sorted by row did not say which list it sorts (item 15, as an option).
- Fixed: tag labels showed through the Find pill's glass. The pill now draws above them.
- Fixed: text under 11 pt (item 13, as an option).
- Fixed: in the first draw, the pill sat in the flow, not over the list. A tag rule had set its position.
- Open, outside this folder: no UI test taps `package-clear` or `tally-clear` (item 4), and none checks the pill on the folded Duo (item 11).
- Questions for the owner: keep Cochin in the mockup against the check (Frame), item 13, and item 15.
