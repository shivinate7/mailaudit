# Panels as sheets: option panels rise from the bottom edge on paper

Mockup: `panels-overlay-directed-1.html`. Designer kind: directed. Direction: sheet: bottom sheet with a grab handle and snap points.
Job: open sorting, filtering, what to show and change history without the list moving, on solid paper, and close with one gesture.
Rulings it serves: `motion-disclosure-panels-arrive` (panels overlay the list, ruled 10-11, debt `panels-overlay-unbuilt`) and `head-panels-carry-paper-fill` (paper fill, item 63 a, debt `panel-paper-fill-unbuilt`). Invariants: `no-layout-shift-under-pointer`, `no-native-dialogs`.

Deep links: `#d=folded|open|phone|ax5` for one device (no `d` shows all). `p=sort|range|history` opens a Ledger sheet. `s=empty` or `s=error` opens History in that state. `k=peek|medium|large` sets the docked sheet (resting, half, full). For example `#d=folded&p=history&s=error&k=medium`. There is no `t=dark`: the native app is held to light, and the mockup draws one theme. Each option has a "Hide this option" control. "Hide tags" removes the Today and New outlines.
Focus ids for the waiting page: `focus-ledger-sheet` and `focus-docked-sheet`, each on its option's folded Duo frame. Each frame shows its own option, so no two share a picture.

## Sizes and sources

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt with the hinge at x 455.5 to 495.5, from the brief. `layout.py devices` gives `unknown` for this repo.
- Large phone: drawn at 402 x 874 pt. **Assumed.** No record, brief or capture gives this phone's size. The repo's CI phone is the iPhone 18 Pro (`duo-ui-runs-on-pr-label`), size not written.
- Status bar and home-indicator band: 20 pt each, unmeasured on these devices. The 20 pt figure is the Duo UI tests' status-bar floor (`DuoHandUITests.statusBarFloor`, as `duo-hand-tap-shift.html` draws it).
- Tab bar: a 64 pt floating capsule (duo-card-in-hand, tab bar text). On two pages it sits under the right page (`DuoSpine`, round 2 item 23 a). Its labels stop growing at the default text size.
- Type, from the app: Cochin 15 relative to Body for row names, Menlo 10.5 to 11.5 relative to Caption 1 for figures (`LedgerTab.partRow`, `TallyView.sortMenu`). AX5 sizes are derived: Apple's table gives Body 17 to 53, Caption 1 12 to 43 and Caption 2 11 to 40 from Large to AX5, so each size scales by that ratio. The resting strip is capped at xxxLarge (Body 23, Caption 1 18).
- Apple pages read 2026-11-21, each answered 200: Sheets (detents, the grabber, swipe to dismiss, one sheet at a time, nonmodal sheets, Cancel on the leading edge), Layout (safe areas, size classes), Accessibility (44 x 44 pt controls, text to 200 percent), Typography (the Dynamic Type tables), Buttons (44 x 44 pt hit region), Tab bars (the bar floats; a tab bar may carry an attached accessory, like the MiniPlayer in Music), Lists and tables.
- Sample data: every seller, card, price, order and version is made up.
- Each frame prints a readout under it: the largest move of any list row when the sheet last opened, moved between snap points or closed. In headless Chrome every readout read 0 pt, on open, drag, grabber tap, swipe down and Escape, in both options.

## Items

1. **Ledger sheet** (option, `#p=sort`). The Ledger tab keeps its rows. Sorted by, Orders from and History each raise their own sheet from the bottom edge instead of opening in the card.
   - Gain: no row moves, by construction: the sheet is out of the list's flow. The paper sheet is opaque, so a row you can see is a row you can tap. Today's entry, order and names stay.
   - Lose: on one page the sheet covers the rows below the pressed one; to go from Sorted by to History you close one sheet first. A sheet covers the tab bar while it is up.
   - Pick: yes. Owner grant: yes (it sets the overlay geometry that `motion-disclosure-panels-arrive` left open).

2. **Docked sheet** (option, `#k=medium`). Showing, Sorted by and Orders from leave the Ledger tab and rest as a docked strip above the tab bar on Packages (and Tally). Drag it to half, and the list re-sorts behind it while you watch; full adds Orders from. Swipe down and it rests again.
   - Gain: the person sets the view where they read the list, and sees each pick land. Native Tally already puts its sort on the working screen (`TallyView.sortMenu`). The tab-bar accessory is an iOS pattern (Tab bars page).
   - Lose: a 72 pt strip stands on every working screen, and the list pads its foot by that much. At half and full the sheet covers the tab bar. History stays on the Ledger tab, so it needs item 1's sheet as well.
   - Pick: no, keep it for the owner to see. Owner grant: yes. Departs from: `ledger-tab-holds-options` ("The working screens hold no option rows"). Not blocking.

3. **Snap points per panel.** Sorted by: fitted, then full. Orders from: fitted, then full (full shows Exact dates). History: half, then full. Docked: resting, half, full; at AX5, resting and full. A snap point within 24 pt of full merges into full.
   - Gain: a short list opens no taller than it needs; the long one opens at half.
   - Lose: three heights to build and test per panel.
   - Pick: yes. Owner grant: no.

4. **The first snap point stops under the pressed row** on one page, when that leaves at least 220 pt. So the row you pressed stays in view (Sorted by and Orders from on the folded Duo). History on the folded Duo has less room and opens at half over its own row.
   - Gain: the person keeps the thing they were looking at.
   - Lose: the sheet's first height depends on scroll; a sheet may open a little short of its content and scroll.
   - Pick: yes. Owner grant: no.

5. **A pick never resizes the sheet.** Only a drag or a grabber tap changes its height. Last… and By month fill a reserved 116 pt slot under the presets, so a pick moves no cell under the finger (`no-layout-shift-under-pointer`). Today's web panel mounts the stepper and the months in flow under the grid (`src/app.jsx`, the `rangeOpen` panel).
   - Gain: nothing jumps inside the sheet either.
   - Lose: the slot holds a sentence when neither is picked. Months past two rows scroll inside the slot.
   - Pick: yes. Owner grant: no. Departs from: the in-flow sub-rows of the `rangeOpen` panel. Not blocking.

6. **One gesture closes.** Swipe the grab handle down. Also: the leading Close button (the Sheets page puts Close on the leading edge), Escape, a second tap on the row, and a pick in Sorted by (today's behaviour: `setSortOpen(false)` after a pick in `src/app.jsx`). A tap on the grab handle steps to the next snap point and never closes (Sheets page). Orders from stays open after a pick, as today.
   - Pick: yes. Owner grant: no.

7. **Paper sheet.** `paper` fill, a 1 pt `line` top rule and a soft shadow, with the house 8 pt corner. The built system sheet draws its own corner. The grab handle is drawn in `inkSoft` (4.68:1 on paper) so it reads as a control.
   - Gain: owner's item 63 a, carried to every sheet. Lose: the sheet is the same colour as the page, so its edge rests on the rule and the shadow alone.
   - Pick: yes. Owner grant: yes (item 63 a covered Sorted by and History; this covers Orders from, Sync and the docked sheet too).

8. **The sheet slides up.** It arrives as an iOS sheet does: a 260 ms slide with no overshoot (`motion-stationery-not-software`), and no motion under reduced motion (`motion-reduced-leaves-it-drawn`).
   - Gain: the system sheet's own motion; nothing to build. Lose: it is not the ruled 220 ms fade with a 4 pt move.
   - Pick: yes. Owner grant: yes. Departs from: `motion-disclosure-panels-arrive` (220 ms fade, 4 px move). Not blocking.

9. **Nonmodal, one at a time.** No dimming. The rows above the sheet stay live (`presentationBackgroundInteraction` in SwiftUI). Opening another panel closes the open one first, as `history-sync-close-each-other` rules for History and Sync and the Sheets page asks.
   - Pick: yes. Owner grant: no.

10. **Open Duo, Ledger sheet: the sheet rises on the page across the hinge from the pressed row.** View sits on the left page, Data on the right. A sheet on the right page stops above the tab bar, so the tabs stay in reach. Nothing sits in the hinge strip.
    - Gain: the pressed row is never covered on two pages. Lose: Ledger becomes a two-page spread.
    - Pick: yes. Owner grant: yes. Departs from: duo-card-in-hand round 2 item 24 b ("Ledger stays full width") and `DuoSpread.spreads(tab:)`, which spreads Tally and Orphaned only. Not blocking.

11. **Open Duo, docked sheet: the options stand open on the right page**, with no grab handle and no snap points, because they cover nothing there.
    - Gain: no gesture on two pages. Lose: leaves the direction on this one pose.
    - Pick: yes, within item 2. Owner grant: no.

12. **AX5.** Rows stack the label over the value (`ViewThatFits`, layout.md ux-swift-same-intent). Option grids go to one column. The resting strip stops at xxxLarge and shows Showing alone; its VoiceOver label reads all three values (precedent: the post bar's cap, duo-card-in-hand item 104 a).
    - Pick: yes. Owner grant: no.

13. **Sorted by at full shows Tally's six keys under the five Packages keys.** Today the set follows the last working view (`package-sort-swaps-with-view`).
    - Gain: set both sorts from one place. Lose: eleven rows, one more thing to read.
    - Pick: yes. Owner grant: yes (it adds a part).

14. **History failed shows Try again.** Native shows the error with no control (`LedgerTab.history`, `ErrorBox`). Empty keeps today's sentence, "No versions saved on this device yet.", with no control (`ux-unknown-is-not-empty` wants one; nothing fills it from here).
    - Pick: yes. Owner grant: yes (it adds a part).

15. **Today and New on native.** Native Ledger holds Sync, History, Backup and Reset (`LedgerTab.body`). The View group (Showing, Sorted by, Orders from) is the web's today and is tagged New on iPhone. Re-import CSV is drawn as on the web.

16. **Not drawn.** Sync takes History's sheet (half, then full). Recent takes the same. The web at 375 and 760 px takes the same shape as a fixed element; the web plan's check (row tops equal with a panel open and closed) still applies.

## Notes for the builder

- One page: `.sheet` with `.presentationDetents([.height(fitted), .large])` (History `[.medium, .large]`), `.presentationDragIndicator(.visible)`, `.presentationBackground(paper)` and `.presentationBackgroundInteraction(.enabled(upThrough:))` on the first detent.
- Docked: the tab view's bottom accessory holds the resting strip (iOS 26; the Tab bars page names the attached accessory, the API page was not read). Whether a drag on the accessory can hand off to a sheet's drag is unknown; a tap that opens the sheet at half is the fallback.
- Two pages: how a system `.sheet` places itself on the open Duo is unmeasured. The mockup's page-bound sheet may need an overlay inside one page instead.

## Checks run on this mockup

- `check_ios_mockup.py`: one fault, `system-font: a font declaration starts with cochin`. Cochin sets the app's words by ruling (`typography-cochin-and-mono`); the page chrome and iOS chrome use the system font. The same fault shows on main's `duo-hand-tap-shift.html`. Reported, not routed round.
- `label_once.py` on three rendered states: within one frame, the sheet title repeats its row's label ("Sorted by", "Orders from"). Kept: the title names the sheet for VoiceOver and at full, where the row is covered. Other hits cross frames or options on the review page.
- Native or web-like (self-read): Ledger sheet `native` (system sheet, grabber, detents, leading Close). Docked sheet `native` on one page (tab-bar accessory plus sheet), `web-like` risk on the open Duo, where the standing page has no system part.

## Critique (impeccable)

Single context: a designer has no sub-agent tool. The context step was skipped; the repo has no PRODUCT.md or DESIGN.md. No snapshot.

- Fixed: the docked sheet drew above its frame (a tag rule set it to `position: relative`).
- Fixed: grids and lists shrank inside the sheet and cut their second row; children no longer shrink.
- Fixed: Escape did nothing after a pick, because the re-drawn body dropped focus; focus now returns to the same control.
- Fixed: the docked strip's labels showed twice at half and full; off the rest a title takes its 52 pt.
- Fixed: the History tail said "7 saved" while the read had failed.
- Fixed: the Orders from slot was 13 pt taller than its first snap point on the folded Duo; the slot is now 116 pt.
- Fixed: the "Hide this option" controls were under 44 pt.
- False alarm (detector): "cream palette". The parchment page is the repo's palette (`design-parchment-ledger`).
- Open: on one page, a Ledger sheet covers the Data rows; reaching History from Sorted by takes a close first (item 1).
- Open: the AX5 masthead fills most of the folded screen above the list; outside this design.
