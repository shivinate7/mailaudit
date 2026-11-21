# Date and stamp editing, directed designer 2: design notes

Mockup: `date-and-stamp-editing-directed-2.html` beside this file. Open it from disk.

Designer kind: directed. Direction: list-first: correct from the history list, no calendar.

The brief says "history list". In this app that list is Recent, the log of single actions (`recent-checks-can-be-undone`). History is the list of saved versions, which this mockup does not touch.

## Sizes, themes and sources

- `layout.py devices` prints `unknown` for this repo, so every size comes from the brief or a record.
- Duo, folded: 466 x 678 pt, tab bar from y 595, 83 pt tall (`duo-fold-and-keyboard`). Drawn at the default text size and at AX5.
- Duo, open: 951 x 669 pt, fold from x 455.5 to 495.5 (brief; `duo-fold-and-keyboard`). The tab bar sits under the right page (`duo-card-in-hand`, item 23). Its 83 pt height is borrowed from the folded reading; unmeasured on the open pose. A headless check found no element across the fold in any state.
- Large phone: no size is written in the brief, in `layout.json`, in the repo or on the Apple layout page read today. Drawn at the folded width, 466 pt, and an assumed 820 pt height. See Input Needed in the report.
- Status bar foot: 20 pt, the floor `DuoHandUITests.statusBarFloor` uses; unmeasured on the Duo.
- Theme: light only. The web has no dark rule, and the native app is held to light (`design-parchment-ledger`). The dark keys in `shared/tokens.json` belong to the orders extension. `#t=light` is accepted; there is no dark state.
- Colours: `shared/tokens.json` only. Words in Cochin, numbers and micro-labels in Menlo (`typography-cochin-and-mono`). App chrome (titles, toolbar, tab bar, segmented control, Apply) in the system font.
- Type sizes, from the Apple typography page: at the default size Body 17, Subhead 15, Caption 1 12, Caption 2 11, Large Title 34; at AX5 Body 53, Subhead 49, Caption 1 43, Caption 2 40, Large Title 60. Micro-labels follow Caption 2 at 11 pt, the Apple minimum, not the web's 10 px floor.
- Apple pages read 2026-11-21, each answered 200: Layout (safe areas; size classes), Typography (the Dynamic Type tables above), Accessibility (44x44 pt default control, 4.5:1 contrast up to 17 pt), Buttons, Sheets (Cancel on the leading edge of the toolbar; Done trailing when present), Lists and tables, Tab bars, Toolbars. The Layout page holds no device size table today.
- Today's behaviour read from: `RecentPanel` and `undoRecent` in `src/app.jsx` (Recent), `RANGES` and the "Exact dates" disclosure in `src/app.jsx` (the range), `nextStamp` and `STAMP_KINDS` in `src/view-rules.mjs` (stamps), `StampSection` in `native/Manifest/StampViews.swift` (the native stamp editor). The native app has no Recent list and no date range today (no match in `native/Manifest`).

## Deep links and focus ids

- States: `#s=rest`, `redate`, `redate-preview`, `redated`, `undone`, `stamp`, `stamp-preview`, `stamp-remove`, `stamped`, `range`, `range-one`, `range-preview`, `ranged`. Add `&date=keep|today` for the stamp date, `&c=slip|daybook` for one concept, `&d=folded|ax5|open|phone|all` for one device, `&labels=off` to hide the Today and New labels.
- Focus ids for the owner's page: `focus-slip` (the slip sheet, Correction slip card), `focus-daybook` (the tray, Day book card), `focus-date-keep` and `focus-date-today` (the slip foot in each stamp-date card). Each finds one visible element; the two date pictures differ in the slip's date.
- Every figure in a preview is computed from the sample arrays in the page, with refunded packages left out of every count (`a-refund-leaves-every-count`).

## Choices

1. **Concept** (`focus-slip`, `focus-daybook`).
   - Correction slip: a tap on a Recent row (not on Undo) opens a slip for that one act. Gain: it starts where the owner already goes after a mis-tap; one act, one slip; the slip lists only the days that act may move to. Loss: it reaches only as far as Recent, 14 days or 200 rows (`recent-checks-can-be-undone`, How far back).
   - Day book: a new list on the Ledger tab with one line per day of the last two weeks. You lift a package or a stamp and tap Move here on a day. Gain: the owner sees every day at once, empty ones too, and fixes by moving. Loss: it adds a third list beside Recent and History; at AX5 the tray hides most of the days; it moves a whole package only.
   - Pick: Correction slip.

2. **A Recent row opens a correction.** The row body becomes a button with a trailing `›`, as the stamp band does (`stamp-band-opens-the-editor`). UNDO stays the right cell. Gain: no new entrance. Loss: a stray tap on a row opens a sheet; it closes with Cancel and changes nothing.
   Departs from: `recent-checks-can-be-undone`, "What a row shows" (the UNDO cell is the row's only control, and the subject is plain text). Not blocking. Owner grant: yes.

3. **A corrected received day is its own field, not an edit of `receivedAt`.** Two written rules break if the fix rewrites `receivedAt`: the merge keeps the later time per key, so a backdated time loses to the other device's copy (`saved-state-shape`); and a Recent count row is live only while `receivedAt` is not older than its newest log entry. So the fix stores a corrected day per card with its own `updatedAt`, merged later-wins. Today no card shows a received date; the only visible day is the Recent row's time and day heading. Gain: the fix survives a merge and leaves Undo of the check intact. Loss: a new persisted field touches the five sites in `src/app.jsx` and `mergeLedger`, and the native raw JSON passes it through.
   Departs from: `saved-state-shape`, an invariant. Not blocking. Owner grant: yes.

4. **The days list.** Received on lists every day from today back to the order date, newest first. Each day says what else happened then ("5 cards checked", "1 stamp set"), read from the ledger. The current day reads Now and does nothing. Days before the order are not offered. Gain: no calendar; the owner knows the day by its mail. Loss: an order of 30 days ago gives 30 rows; quiet days are 44 pt rows with no line under them. Pick: this.

5. **Which cards.** A package checked in one tap can still have arrived in two envelopes. The slip lists its card lines, all ticked, below the days. Gain: a split package can be fixed. Loss: one more section to scroll past. Pick: keep it below the days.

6. **What will change.** A manila slip pinned to the foot, its height reserved from the moment the sheet opens, so a pick moves no row (`no-layout-shift-under-pointer`). It names the count, the seller, the old day struck and the new day, and the side effects: "Counts, cost and flags stay" for a day, the count change and the lost-mail flag for a stamp. Apply names the act ("Move to Thu Nov 19", "Change to Claim filed"). At AX5 nothing is reserved and the empty slip hides; the disabled button says what is missing. The brief asks to show the change first and to offer Undo after. House rule ux-ask-or-undo says a destructive press asks or offers Undo, never both. The brief wins here; the slip is a preview, not an ask.
   Departs from: ux-ask-or-undo, as `ux-house-rules-govern` applies it. Not blocking. Owner grant: yes.

7. **Undo after a fix.** The fixed row changes in place: its seller line gains "Received ~~Nov 20~~ → Nov 19", and its UNDO cell now undoes the fix. After that undo the cell reads `FIX / UNDONE`. The fix is also a new Recent row (`RE-DATED` or `STAMP CORRECTED`), shown on the next open, because the panel freezes its rows (`recent-checks-can-be-undone`, No layout shift). Gain: the answer shows where the press was. Loss: one cell undoes two different acts over time; the check's own Undo comes back only on the next open, as its own row.
   Departs from: `recent-checks-can-be-undone` (a new log kind and a new end state). Not blocking. Owner grant: yes.

8. **Stamp correction.** The six kinds as a list, the current one marked Now; then Remove stamp; then Dated. The slip shows what each pick does to the counts: leaving a refund brings the package back into every count ("3 cards, $2.90 still out; packages in the ledger 39 → 40"); Partial refund stays out. Removing the stamp shows the may-be-lost flag coming back for an untracked package 14 days or more past its order (`lost-mail-flags-use-order-date`, `stamped-package-hides-lost-flag`). Remove is the danger colour. Pick: this.

9. **Which date a corrected kind keeps** (`focus-date-keep`, `focus-date-today`).
   - Keep the stamp's date. Gain: a correction fixes a mistake; the claim was filed on the day it was. Loss: differs from today's rule.
   - Date it today. Gain: today's rule, `nextStamp` re-dates on a new kind (`one-stamp-per-package`). Loss: the fix moves the stamp to a day nothing happened.
   - Pick: Keep the stamp's date.
   Departs from: `one-stamp-per-package` ("Picking another kind replaces the old stamp, and it re-dates the stamp"). Not blocking. Owner grant: yes.

10. **A stamp date set by hand** (Day book only, Date here). Lets the owner move a stamp to the day it happened, with the kind unchanged. Gain: one gesture for days across packages and stamps. Loss: `at` is no longer only the day the stamp was set.
    Departs from: `one-stamp-per-package` ("A stamp is dated the day it was set"). Not blocking. Owner grant: yes.

11. **The range, picked from order days.** Showing opens a list of the order days the ledger holds, grouped by month, each with its package count and how many are still out. Tap one end, then the other, in either order; a rail marks the days between. A month heading takes the whole month. The 30, 45, 60 and 90 day presets and All time stay as chips. The slip says "19 packages ordered Tue Oct 27 to Tue Nov 10, 6 still out. Was: All time, 39 packages. Packages and Tally both follow it." Gain: no keyboard, no calendar, and the owner sees what each day holds before picking it. Loss: the "Last…" free day count and the "Exact dates" native date pair go; a day with no orders cannot be an end.
    Departs from: `ruled-head-range-picked` (By month, and Exact dates behind a disclosure) and `date-filter-spans-ledger-views` (the "Last…" day box). Not blocking. Owner grant: yes.

12. **Undo a range.** A range is a view preference, and Recent logs none (`recent-checks-can-be-undone`, What the log holds). So after Apply a `Back to <previous range>` cell sits beside the Showing value until the next pick. Gain: one tap back. Loss: it is not synced and leaves on reload, as the panel state does (`date-filter-spans-ledger-views`). Pick: this. Orphaned hides the range, as today.

13. **Open Duo.** Correction slip: Recent on the left page, the slip as the right page, so the list never hides; with nothing picked the right page says what to tap. Day book: the book on the left page, the lifted item, the kinds and the change on the right page. Apply and Cancel sit on the right page above the tab bar.

14. **Day book layout.** Every day of the last 14 keeps its line, empty days too, so a move has a place to land. Each day line reserves a 112 pt slot on the right; Move here, Date here, Start here and End here appear in it, so nothing reflows. The lifted line turns manila with an accent edge. On the folded pose the tray is one line while you pick, so the days stay in view; after a pick it grows over the list as an overlay. A moved line stays where it was, reads "Moved to Thu Nov 19" and offers UNDO; the book re-sorts on the next open, as Recent does.

15. **AX5.** Rows drop their fixed 72 pt height and wrap; the 72 pt rule of `recent-checks-can-be-undone` is a web measure and does not hold at AX5. The tab bar stops growing at the default size (`duo-card-in-hand`, Tab bar text). Toolbar titles are drawn at 17 pt; whether the system grows them on the Duo is unmeasured. Apply grows with Headline. Loss, Day book: the tray covers most of the screen, so Move here targets need a scroll above it. Loss, Correction slip: the days list starts below the fold.

16. **Repeated control words.** UNDO, Move here and Start here show once per row. `label_once.py` may flag them. Each is one control per row, as `recent-log-notes` item 12 treats UNDO, so these notes treat them as data. "No mail" was a repeated label and is gone; an empty day shows only its date.

17. **Reach.** List-first means a fix starts from a list. Recent reaches 14 days or 200 rows. A package received earlier cannot be re-dated from the Correction slip. Not drawn: the same slip opened from a package card in Packages would cover it.

18. **Remove stamp, the note and one stamp editor.** Today the band opens `StampSection` (`native/Manifest/StampViews.swift`; the web editor in `src/app.jsx`): six kind cells, a 16 pt note field, a two-tap Remove whose arm reads "Tap again to remove stamp from N cards" with first focus on Cancel, and Cancel and Save. The slip keeps the six kinds, the 16 pt note field (the note goes with the stamp) and the card count, now on the Apply button: "Remove stamp from 3 cards". It replaces the two-tap arm with the preview and one Apply, and adds Dated. The Day book tray has no note field. The slip is meant to be that same editor grown, opened from the band and from Recent, not a second one (`building-one-home-per-capability`). Gain: one editor that also corrects. Loss: Remove loses its arm, so a stray tap on Remove stamp then Apply removes it; Undo takes it back.
    Departs from: `stamp-band-opens-the-editor` (the two-tap Remove arm, first focus on Cancel). Not blocking. Owner grant: yes.

## Design review of this mockup (self-check)

The design-review skill's two blind reviewers and its compare step need spawned agents; a designer cannot spawn, so this is the designer's own read of the screenshots. A verdict per screen, light theme, the only theme:

| Screen | Folded | Folded AX5 | Open | Large phone (assumed size) |
| --- | --- | --- | --- | --- |
| Correction slip | pass | pass, days list starts below the fold | pass | pass |
| Day book | pass | fail, the tray hides most Move here targets | pass | pass |

- Correction slip: `native`. A sheet with Cancel on the leading edge, grouped list rows with checkmarks, a large title and a floating tab bar. Web-like parts: the underlined mono UNDO and value cells, carried from the web's Recent and ruled head.
- Day book: `web-like` in part. The segmented control, the rows and the tab bar are native; the dashed Move here targets and the two-column grid of kind chips are not iOS controls. A native build would use a row accessory or swipe action for Move here and a list for the kinds.

## Checks run on this mockup

- `check_ios_mockup.py`: one fault, `system-font`, because content text is Cochin. The skill asks for the system font in the app chrome; this repo rules Cochin for words (`typography-cochin-and-mono`). `duo-hand-tap-shift.html` and `orphaned-meta-line-wraps.html` fault the same way. Likely a false alarm on content type.
- Headless Chromium: no script error, no duplicate id, no sideways scroll, no element across the fold, no button under 44 x 44 pt in the frames, in every listed state. The 44 pt check went red on an injected 20 pt button. A click-through of every path passed: re-date, stamp kind, stamp date only, Remove, Undo of each fix, Undo of a plain row, range by two ends, by month and by preset, Back to, the Order days and Mail days switch, unticking every card (Apply disables), and Cancel.
- Critique (impeccable, design review only, native platform): see the report. Fixed: Today and New tags drawn over the sheet; the days list hidden under the slip on the folded pose; the Day book tray hiding the days; "No mail" repeated; the empty slip filling the AX5 sheet. Open: items 15 and 16.
