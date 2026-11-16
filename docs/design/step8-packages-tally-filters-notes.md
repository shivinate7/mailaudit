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
   - What: a capsule pinned above the system tab bar on Packages and on Tally. It holds a magnifier, a Cochin 16 field, and a 44 x 44 pt clear slot. The placeholder is "Find card, set, seller, order" at normal type sizes, and "Find" at accessibility sizes, where the full prompt was cut off (`FindPill.promptText`). It sits 16 pt in from each side and 8 pt above the bar. It draws only while the ledger holds items. One query serves both tabs.
   - Sources: `FindPill`, `View.findPill(show:query:change:)`, `PackagesView.pillShown`, `TallyView.findPillShown`; web `.mdl-pill`.
   - Gain: the main input sits in thumb reach (`ux-thumb-zone`), and Apple's search-fields page allows bottom placement. Loss: it covers the last 68 pt of list at rest at normal type sizes (48 pt pill, 8 pt above and below). At accessibility sizes the field holds one line (`FindPill.fieldLines`) and the pill follows the text. Before that fix, an empty second line made it 87 pt tall at AX3 and 110 pt at AX5 (design review, screen-check run 43765127724), and the pill hid "14 still missing" and the VALUE figure. At AX sizes the masthead's height now hides those figures, not the pill (debt `masthead-at-ax-sizes`). A bottom content inset scrolls the list clear. Item 17 ends the list above the pill instead.
   - Pick: as built.
   - Departs from: the mockup, which centres the empty placeholder. Accepted: on the build the placeholder sits on the top line of the two-line field, its magnifier 6 to 8 pt lower. The build keeps two lines so the 44 pt hit region holds at normal sizes (`FindPill.swift`). Source: step 8 design review round 3, screen-check run 43796388049, head e1560957, iPhone 18 Pro, light.
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
      - The list scrolls clear of the pill and the bar (`FindPillMetrics.duoRoom`). Item 17 ends it above them instead.
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

16. **The Find pill's fill.** New. The owner ruled: a near-opaque fill, so no list text shows through, and no wider audit skip.
    - Mockup: `docs/design/step8-find-pill-fill.html`. Deep links: `#o=paper`, `#o=card`, `#o=near`, `#o=today`; `s=packages`, `s=tally`, `s=duo`; `x=normal`, `x=ax`; `t=light`, `t=dark`. Join them with `&`, for example `#o=paper&s=tally&x=ax&t=dark`. With no hash, every option shows, and `prefers-color-scheme` sets the theme. "Hide opaque card", "Hide paper at 94%" and "Hide today" each remove one option. Focus ids: `focus-paper`, `focus-card`, `focus-near`, `focus-today`, and `focus-duo` for the open Duo.
    - Built: `FindPill.body` fills the capsule with opaque `Parchment.paper`, with no material. Before, it was `.ultraThinMaterial` under `Parchment.paper.opacity(0.62)`, list text showed through, and the audits `AuditSkippingTabBarUITests.testTheSameIssuesFailOnceTheBarMovesAway` and the `MastheadBackupUITests` Packages audit failed with "Contrast failed" behind the pill. Rows still pass under the opaque pill; item 17 ends the list above it.
    - The spec (pick):
      - Light: one layer, `Capsule().fill(Parchment.paper)` at opacity 1.0. Drop `.ultraThinMaterial`, because an opaque fill hides it.
      - Dark: the token `darkPaper` at 1.0. The hairline is `darkLine`, and `darkAccent` while focused. The native app ships light only (`native/project.yml` `UIUserInterfaceStyle: Light`). `Parchment` has no dark accessor, and only `extension/build.mjs` reads the dark keys. So the dark line is a spec for a later dark theme, not a change to make now.
      - The hairline stays as built: `Parchment.line`, 1 pt, and `Parchment.accent` while focused (`FindPill.body`, the `strokeBorder` overlay).
      - No shadow. The native pill has none today, and this spec adds none.
      - All else stays as built: the 44 x 44 pt clear slot, the 48 pt minimum height, and one line at AX sizes.
      - The open Duo gets the same fill, since `findPillOnDuo` draws the same `FindPill`.
    - Tokens, read from `shared/tokens.json` through `Parchment.color` (`native/Manifest/Theme.swift`): `paper` #F2E9DA, `card` #FCF6EA, `ink` #332E3F, `inkSoft` #6E6379, `line` #DCCDB6, `accent` #6F5CA6; `darkPaper` #1E1B24, `darkCard` #27232E, `darkInk` #EFE6D6, `darkInkSoft` #B1A6BB, `darkLine` #443D4D, `darkAccent` #A796DA.
    - Why 1.0 and not "near" 1.0. Contrast ratios are by the WCAG formula. Apple's accessibility page asks for 4.5:1 for text up to 17 pt.
      - The placeholder, `inkSoft` on `paper`, is 4.68:1 on a clear fill. That leaves 0.18 of margin.
      - At any opacity under 1.0, a row's ink shows behind the placeholder and pulls it down. At 0.97 it falls to 4.45:1, under the floor.
      - The list text under the pill is the element the audit flags. At 0.94 its ink still reads as text at 1.12:1.
      - Every under-1.0 figure here is a worst case with no blur. The material softens it.
      - So "no text shows through" holds only at 1.0. I read the ruling's "near-opaque" as opaque. Not blocking.
    - Options in the mockup:
      - Opaque paper. Gain: nothing shows through, and it keeps the web's paper colour. Loss: the pill no longer matches the 62% glass of the system tab bar and the Duo bar below it, and over a card row it reads as a slightly darker band. Pick: yes. Owner grant: no, because the ruling covers it.
      - Opaque card. Gain: a placeholder margin of 5.24:1 light and 6.62:1 dark. Loss: the card colour blends the pill into the card rows, so it reads as one more card. Pick: no. Owner grant: yes, since it changes the pill's colour.
      - Paper at 94% over the material. Gain: a trace of glass stays. Loss: a smear of the row stays, and the placeholder over it drops under 4.5:1. The page's CSS blur is heavier than iOS `ultraThinMaterial`, so the page draws the smear fainter than the phone would. Pick: no.
      - Today. Drawn for comparison only.
    - Departs from: `src/app.jsx` `.mdl-pill`, the web pill: paper at 62%, an 18 px backdrop blur, and a two-layer `shadow` box-shadow. The owner ruled the native departure. The web pill keeps its glass, and this item does not change it. Not blocking.
    - Frames: the folded Duo, as the bottom 280 pt of the 466 x 678 pt outer screen, for Packages and Tally at normal size and AX5. Then the open Duo, as the bottom 220 pt of 951 x 669, with Tally. The AX5 pill is drawn 83 pt tall. That is 110 pt minus the empty 27 pt second line, from `FindPill.swift`'s doc comment and screen-check run 43765127724; it is derived, not measured. AX3 would draw at 67 pt by the same sum. Item 17's brief gives 51 and 59 pt for the one-line pill; neither figure is measured here. AX text is drawn to fit, not at a measured size.
    - `.find` in `step8-packages-tally-filters.html` drew the web's glass and box-shadow. It now draws the pick, opaque paper with no shadow, so the design review judges the built pill against the ruled fill. Until the builder lands it, item 1's frames are ahead of the build in this one part.
    - Unmeasured: whether the opaque fill turns the two audits green. A text element half under an opaque view may still be sampled. The proof is a re-run of those two tests on the build.

17. **The list ends where the Find pill begins.** New. Direction from the coordinator (lane restyle-step8, PR 238): no row sits under the pill at rest. Not an owner ruling.
    - Mockup: `docs/design/step8-find-pill-room.html`. Deep links: `#o=hard`, `#o=rule`, `#o=fade`, `#o=today`; `d=fold`, `d=duo`, `d=pro`; `s=packages`, `s=tally`; `x=normal`, `x=ax3`, `x=ax5`; `t=light`, `t=dark`. Join them with `&`, for example `#o=rule&d=pro&x=ax5`. "Hide hard edge", "Hide hairline rule", "Hide short fade" and "Hide today" each remove one option. Focus ids: `focus-hard`, `focus-rule`, `focus-fade`, `focus-today` (the list viewport of each option's first 18 Pro frame).
    - Today: `View.findPill` (`FindPill.swift`) is `.safeAreaInset(edge: .bottom)`. A scroll view runs under a bottom inset, so it stays full height and rows pass under the opaque pill at rest. Measured on macOS run 43848366093 (brief, not read by me): row text at y 723 to 737 against a pill top at 727 fails the contrast audit, and the stamp editor's Save and the Tally "+" land under the pill, where taps hit the pill.
    - The spec (pick: hairline rule):
      - One page (18 Pro, folded Duo). `findPill(show:query:change:)` becomes a `VStack(spacing: 0)`: first the view it wraps (the `MastheadScreen`, whose `ScrollView` now ends at the band's top), then, when `show`, the band. The band is `FindPill` with `.padding(.horizontal, 16)`, `.padding(.top, 8)`, `.padding(.bottom, 8)` as built, `.frame(maxWidth: .infinity)`, `.background(Parchment.paper, ignoresSafeAreaEdges: .bottom)`, and `.overlay(alignment: .top) { Rectangle().fill(Parchment.line).frame(height: 1) }`. No safe-area inset.
      - So the list's edge sits 8 pt above the pill's top, whatever the pill's height. The 1 pt `Parchment.line` rule is the band's top and spans the full width. It is the same rule that closes the running head (`MastheadScreen.swift`, `RunningHead`, the bottom overlay).
      - Tally: apply `errorBar` to the list before `.findPill`, so the check-in error sits on the list's edge, not over the band (`TallyView.body` and `TallyView.list` today put the overlay outside the pill).
      - Open Duo, Packages (one list across both pages, `PackagesTab`). Replace `.contentMargins(.bottom, duoPillShown ? FindPillMetrics.duoRoom : 0, for: .scrollContent)` (`PackagesView.swift:72`) with `.padding(.bottom, duoPillShown ? FindPillMetrics.duoRoom : 0)` at line 72 itself, after the `checkin-error` overlay (lines 64 to 69), plus the same 1 pt rule at its bottom. Then the error bar sits on the list's edge, above the pill and the bar; that may close debt `duo-checkin-error-under-bar` (unmeasured). The pill stays `findPillOnDuo`. It measures from the window's bottom (`.ignoresSafeArea(.container, edges: .bottom)`, `FindPill.swift:107`), so the cut must too: apply the padding to a view that ignores the container's bottom safe area the same way, or the gap grows by the home-indicator inset. Builder check: the gap reads 8 pt on the open Duo. `duoRoom` = `DuoBarMetrics.height` 76 + 8 + `FindPillMetrics.height` 48 + 8 = 140 pt, so the edge sits 8 pt above a 48 pt pill.
      - Open Duo, Tally. The left page has nothing over it and is unchanged (duo ruling Q5, 2026-11-08 11:14 CST, as `TallyView.body` cites it). The right page's `detail` takes the same change: replace `.contentMargins(.bottom, duoRoom)` (`TallyView.swift:74`) with `.padding(.bottom, duoRoom)` and the rule, measured from the window's bottom as above.
      - On a list cut this way, `DuoSystemBar`'s 76 pt margin (`DuoSpine.swift:78`) leaves 76 pt of dead space at the list's end. Set `.contentMargins(.bottom, 0, for: .scrollContent)` on the cut scroll. Builder check: that an inner `contentMargins` overrides the outer one is not verified.
      - One home: draw the rule in one modifier in `FindPill.swift` and call it from all three places (`building-one-home-per-capability`).
      - The `scrollTo(id, anchor: .bottom)` that keeps a focused field or a Save in view (`MastheadScreen`) now lands above the band. That is the fix for Save and "+". With the old inset, the anchor sat under the pill.
    - What the user loses.
      - 18 Pro, normal size: the scroll frame ends at y 719. That is 72 pt above the tab bar's top at 791 (155 pt above the screen's foot). Readable rows at rest lose only 8 pt (pill top 727 to 719), plus the faint view through the 12 pt gap and the glass bar. The pill and its gap already hid the rest.
      - AX3 and AX5: the pill is one line, 51 and 59 pt. Those are the brief's figures and were not measured by me. Item 16 derived 67 and 83 pt from the old two-line pill. The spec is relative to the pill's top, so it holds either way. The edge sits at 720 (AX3) and 712 (AX5). Against the bar top: 71 and 79 pt.
      - AX5 rows still in view, with the running head pinned: the view runs from about 101 (a 54 pt safe area, a guess, plus the 47 pt slot) to 712, so 611 pt. That holds about 6 package lines or about 4 Tally rows. These are estimates from the mockup's drawn AX5 type, not measured. Against today, at rest you lose under a tenth of a row. To measure: a screen-check at AX5 on Packages and Tally.
      - Open Duo, Packages: 140 pt less list on both pages, the left page too, where nothing covers the list today. That is 21% of 669 pt. See Input Needed.
    - Keyboard. One page: the band sits in the keyboard-avoiding safe area, so it rides the keys up. The scroll frame shrinks from its bottom, and its content offset does not change. So rows above the new edge keep their frames, and rows below it are clipped, not moved. That is what `FindPillUITests.testOpeningSearchMovesNoPackageRow` asks for. Its source is the invariant `no-layout-shift-under-pointer`. I found no dated owner ruling for "no row moves when search opens" in `docs/`, `invariants/` or the notes, so none is cited. Open Duo: the pill overlay still lifts with the keys. The cut scroll shrinks with the keys too, so the 8 pt gap holds, and the 76 pt of bar room stays under the edge while the keys cover the bar. Unmeasured; debt note "the open Duo's pill may ride the keyboard top" (`docs/debts/notes.md`, step 8 review round 2).
    - Options in the mockup:
      - Hard edge. Gain: nothing new is drawn. Loss: a card cut at the edge loses its border with no end, which reads as a drawing fault. Pick: no.
      - Hairline rule on a paper band. Gain: the cut ends on a ruled line, which is the app's own vocabulary (the running head's rule, `RuledRow`). Loss: one more line on screen. Pick: yes. The brief's "paper band" is this option: the list is paper too, so a band with no rule draws the same picture as the hard edge.
      - Short fade, 16 pt to paper. Gain: Apple's layout page (read 2026-11-16) says to use a scroll edge effect instead of a solid backing under controls. Loss: the owner already ruled an opaque pill (item 16), and a fade lowers the contrast of the very row text the audit flags. Pick: no.
      - Today. Drawn for comparison only.
    - Unmeasured: whether the audits go green. The straddle moves from the pill's top to the list's clip edge. A row cut by the edge may still report an accessibility frame past the edge onto plain paper, and the audit may sample it. The proof is a re-run of `AuditSkippingTabBarUITests.testTheSameIssuesFailOnceTheBarMovesAway` and the `MastheadBackupUITests` Packages audit on the build. What the band fixes for sure: no tap lands on the pill through a row, and Save and "+" scroll above the band.
    - Departs from: `FindPill.swift:3` ("The floating search pill") and the `findPill` doc comment at `FindPill.swift:84-85` ("The bottom inset moves the last card clear of the pill"). Both change to "pinned under the list". Item 1's "pinned above the tab bar" still holds. Also departs from `phone-nav-is-bottom-bar`, section Find, "A floating search pill". That record is the web's; the web keeps its floating pill, and only native departs. Not blocking.
    - Owner grant: yes. The native pill stops floating over the list, and the open Duo's Packages list loses 140 pt on both pages.
    - Frames: the folded Duo (bottom 280 pt of 466 x 678), the open Duo (bottom 240 pt of 951 x 669) on Packages and Tally, then the 18 Pro (bottom 300 pt of 402 x 874) on Packages and Tally at normal size, AX3 and AX5. The 18 Pro pill is drawn at its measured 727 to 779; the folded Duo pill per the code, 8 pt above the bar. AX type is drawn to fit, not at a measured size.

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
- Item 16, run on `step8-find-pill-fill.html`, 2026-11-15. It was a single-context run, because a designer has no sub-agent tool. The launcher did not run, and no PRODUCT.md or DESIGN.md exists.
  - Fixed: the deciding contrast figures were only in the notes. Each option now prints them.
  - Fixed: the CSS blur draws the 94% smear fainter than the phone would. The option now says so.
  - Fixed: the frames lacked static Duo `data-device` markers, so `check_ios_mockup.py` found no frames. They now come from templates.
  - Fixed: the step 8 mockup's pill drew the web's shadow.
  - False alarm (detector): "cramped padding" on the tab bar capsule. Its labels sit centred in a 56 pt bar.
  - Not drawn: the focused pill's accent hairline. It is unchanged from the build.
- Item 17, run on `step8-find-pill-room.html`, 2026-11-16. Design review alone: the target is native, so no detector and no snapshot. The launcher did not run, and no PRODUCT.md or DESIGN.md exists.
  - Fixed: the Today frames reused the new captions ("List edge 719"). They now say the list runs under the pill.
  - Fixed: the pick sat second. It now leads the page, the nav and the hide buttons.
  - Fixed: the 8 pt gap's label was 9 pt. It is now 11 pt.
  - Kept: the hard edge and the rule differ by 1 pt, so a frame scaled down to phone width shows them nearly alike. That is the true size.
  - `check_ios_mockup.py`: the same one fault as before, `system-font` on Cochin (Frame).
- Open, outside this folder: no UI test taps `package-clear` or `tally-clear` (item 4), and none checks the pill on the folded Duo (item 11).
- Questions for the owner: keep Cochin in the mockup against the check (Frame), item 13, and item 15.
