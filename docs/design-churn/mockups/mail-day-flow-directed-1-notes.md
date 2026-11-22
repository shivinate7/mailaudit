# Mail day as one conveyor: notes

Mockup: `docs/design/mail-day-flow-directed-1.html`. Open it from disk.

Designer kind: directed. Direction: conveyor, a single linear path, one step at a time.

## How to read the mockup

- Two concepts, Stations and Card belt. Each has a Hide button; "Show hidden concepts" brings them back. Focus ids: the folded frame of each concept, `focus-stations` and `focus-belt`. Each is one static element, present in every state.
- Each concept draws four frames that share one state: Duo folded, Duo open, the large phone, and Duo folded at AX5. A press in any frame moves all four.
- Deep links take the form `#c=<concept>&s=<state>`:
  - Stations: `#c=stations&s=bring`, `sort`, `envelope`, `tie`, `post`, `nomatch`, `aside`, `pile-done`, `error`, `paused`, `done`, `done-well`, `empty`.
  - Card belt: `#c=belt&s=bring`, `card`, `tie`, `post`, `mid`, `error`, `paused`, `done`.
- Mockup helpers sit outside the frames. "Type the Next Card for Me" types the next card from the sample pile. "Fail the Next Save" makes the next check-in fail. "Reload the Page" proves the place survives. "Start Over" resets the concept.
- The page keeps its own state under its own localStorage key. The app's frozen keys (`storage-keys-are-frozen`) are not touched.
- Dashed labels mark "Today: <part>" for what exists and "New: <part>" for what this direction adds. The "Today and New labels" switch hides them.

## Frame

- Duo folded: 466 x 678 pt, the outer screen (`duo-fold-and-keyboard`, re-measured 2026-11-08). Keys: 289 pt tall, the taller of the two outer-screen readings.
- Duo open: 951 x 669 pt. Nothing sits across x 455.5 to 495.5, the fold strip. The keys panel draws from y 405 (`duo-fold-and-keyboard`).
- Large phone: `layout.py devices` gives `unknown` for this repo. The HIG layout page read on 2026-11-21 has no device table, and the brief gives no size. So the phone frame is a stand-in. It starts at the folded outer screen, 466 x 678 pt, and resizes by its corner, from 320 to 560 pt wide. The single-column layout holds across that range. The phone's keyboard height is also unwritten; it is drawn at the Duo outer-screen reading. See Input Needed in the report.
- AX5: the folded frame with the HIG AX5 row: Large Title 60, Title 1 58, Title 2 56, Headline 53, Body 53, Subhead 49, Footnote 44, Caption 1 43, Caption 2 40.
- The status bar and the home indicator are drawn at 20 pt each. Both are unmeasured on the Duo, as in `duo-hand-gaps-notes`.
- Light theme only. The native app is held to light (`native-build-lanes`, the N13 notes).
- Tokens come from `shared/tokens.json`. Cochin sets words, and Menlo sets numbers (`typography-cochin-and-mono`). The system font sets chrome only: the status bar, keys and tab bar.
- Apple pages read on 2026-11-21. Each answered 200 through `developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:
  - layout: respect the safe areas. The page has no device table.
  - typography: the Large (default) and AX5 Dynamic Type rows above. Minimum text size 11 pt.
  - accessibility: default control 44 x 44 pt.
  - buttons: hit region at least 44 x 44 pt.
  - sheets: not used. Set Aside opens in place.
  - lists-and-tables, tab-bars, toolbars: the read sources for the list rows and the tab bar.
  - progress-indicators: a determinate bar fills from the leading side.
- `python3 ~/.claude/lint/check_ios_mockup.py` reports one fault: `system-font: a font declaration starts with cochin`. Today's `duo-hand-gaps.html` fails the same way, though `duo-hand-gaps-notes.md` records exit 0 for it. So either the check tightened after that mockup, or that record is wrong. Cochin in content is the repo's rule (`typography-cochin-and-mono`). The house rule `tokens.md` also allows a brand font in content. The check may be a false alarm here; see the report.

## Sample data

Invented. Six envelopes in two piles of three. Kestrel Card Co. comes short one Brainstorm. Arcane Signet ties Low Tide Games and Tinpot Cards. Sol Ring decides the tie. "Mox Opal" matches no open order. Gilt Edge Games, ordered 2026-10-30, is past its usual transit.

## Design choices

1. **The mail day is one path with stations.**
   - What: the whole day is one ordered path. Stations has four steps: Bring In, Sort, Open, Done. Card belt has three: Sort and Count, Open, Done.
   - Gain: the next step is always the one press in the thumb slot. The person always sees which step they are on.
   - Loss: three tabs and a control become one mode, which is a new structure to learn.
   - Pick: both concepts. The owner picks one by looking.
   - Departs from: today's start, which is the Ledger tab (`RootView.startTab`). Today's Card in Hand opens from `hand-open` on Packages (`PackagesView.openHand`) and covers both pages.

2. **The flow covers the tab bar.** Owner grant: yes.
   - What: while the mail day runs, the tab bar is hidden. Pause leaves the flow. The Packages tab then shows a Resume Mail Day row where `hand-open` sits today.
   - Gain: there is no side door. "Where am I" has one answer.
   - Loss: Tally and Orphaned are one press further away during the day.
   - Pick: hide the bar.
   - Departs from: `duo-card-in-hand`, which keeps the tab bar under the right page (round 2 item 23 a). Item 35 (`duo-card-in-hand-entry`) is still open; this is a third answer to it.

3. **The flow runs folded and on the phone.** Owner grant: yes.
   - What: Card in Hand works on one page: folded, on the phone, and at AX5.
   - Gain: the person can carry the phone in one hand at the mail box, which the brief asks for.
   - Loss: on one page the envelope and the field share one column. With the keys up, the lines sit under the keys until a line tap or Done hides them.
   - Pick: run on every pose.
   - Departs from: `PackagesTab.twoPages` (`native/Manifest/HandScreen.swift`), which opens Card in Hand only on two pages side by side.

4. **Keep the place: one new datum.** Owner grant: yes.
   - What: almost all of the place comes from data that exists. Checked in today comes from `receivedAt` since local midnight, as in `duo-hand-gaps-notes` part 7. An envelope set aside as "Record in Orphaned" is an `envelopes` record, the existing shape (`orphan-entry-takes-one-input`). A short envelope stays short, and shows under "Not normal today". The only new data is the day's piles and the place in them: pile sizes, the envelope index, the open envelope, the typed text and the held names.
   - Gain: the person leaves at any step and comes back to the same step, with the text they typed (`ux-keep-what-was-made`).
   - Loss: one new field. It must be optional and defaulted on load (`saved-state-shape`). Proposed as device-local, like `workerSyncedAt`: it rides the save payload and the load effect only. It is not in `snapshot()`, a backup, a restore or the merge, so the five-site count does not grow. The storage key stays `mailday:v1` (`storage-keys-are-frozen`).
   - Pick: device-local. The other option is a synced field, so a day started on the Duo resumes on the phone. That touches all five sites and `mergeLedger`.
   - Today: `HandScreen` keeps the query in `@State`. Close drops it; `HandModel.close()` keeps only the held names.

5. **Counting the pile.** Owner grant: yes, as part of item 4.
   - What: "how much is left" needs the pile's size, and the app cannot know it. Stations asks once with a stepper. Card belt counts as the person sorts: one tap per envelope, and Start a New Pile.
   - Gain: a true "Envelope 3 of 6" and a meter that fills.
   - Loss: one more input before the first card. A count that is wrong stays wrong until it is corrected; the Sort station lets the person correct it.
   - Pick: both are drawn, one per concept.

6. **Small piles.**
   - What: Stations lets the person split the count into piles with steppers. Its Open Pile 1 button stays off until the piles add up to the count, and says why. Card belt makes a pile with Start a New Pile. Between piles, one screen says "Pile 1 is done" before Open Pile 2.
   - Gain: a finish line every three or four envelopes, which the brief asks for.
   - Loss: one extra press per pile.
   - Pick: keep it.

7. **The thumb slot.**
   - What: one fixed row at the bottom, or above the keys, holds the step's act. Stations: Set Aside and Next Envelope. Card belt: Set Aside and Check In, or Post, or Hold. The row never moves. Its label changes in place (`no-layout-shift-under-pointer`).
   - Gain: the next act is under the thumb (`ux-thumb-zone`).
   - Loss: the label changes in place. In Stations, a quick double press after Hold lands on Next Envelope. So Hold sits in the tie block, not the slot. In Card belt, Envelope Empty sits beside the field, away from Check In.
   - Pick: keep it.

8. **Next Envelope is New Envelope.** Title Case, owner ruling item 81 b.
   - What: Next Envelope ends the envelope, as New Envelope does (`new-envelope-ends-an-envelope`), and counts the pile down. It keeps one label on every envelope, the last one included (`ux-one-plain-name`). The milestones live on their own screens: "Pile 1 is done." and Done. Card belt names the same act Envelope Empty, also on every envelope.
   - Next Envelope is filled only once an envelope shows. Before that, as on a tie or a no-match, it is drawn quiet, so it does not invite a press that would release a held card.
   - Gain: one name per act. The emphasis follows the moment.
   - Loss: the button does not warn that a press ends the pile; the next screen says so.
   - Pick: Next Envelope. Departs from: the name New Envelope. Card belt's Envelope Empty departs further; the owner may want New Envelope kept.

8a. **The shown envelope stays after its typed card checks in.**
   - What: after a line tap checks in the typed card, the query no longer matches an open line. The envelope stays on screen anyway, so the lines stay under the finger. This copies today's `HandScreen.shown`, which a check-in or a post leaves in place.

8b. **The count line.**
   - What: "Envelope 3 of 6", then "4 left, pile 1 of 2" in small type, and a determinate bar below it (HIG progress-indicators). Stations shows "5 of 6 in piles" while sorting, and "6 of 6 accounted for" at Done.

9. **Every move forward is a press.**
   - What: nothing checks in by itself. A unique match shows its envelope and checks nothing in (`orphaned-mail-never-decides`, `HandModel` "only post() saves"). Stations checks in by the line's own tap, as today. Card belt adds Check In for the typed card, which is the same write as that line tap.
   - Gain: no surprise writes.
   - Loss: Card belt costs one press per card. Its "Still owed here" chips let a press pick the next card without typing.

10. **Ties, Suspense and Post keep today's rules.**
    - What: a shared name shows its envelopes with Hold. A held name sits on the Suspense line, with the chip "1 held" in the field (`hand-held-chip`). The deciding card shows the Post offer under the sender. The typed card's line carries the accent bar (item 77 a). A held line carries the manila tint and "on the Suspense line" (part 5). Next Envelope releases what is held, as New Envelope does.
    - Card belt puts Post in the thumb slot, above the keys. That is item 42's option B. Stations keeps option A, under the sender. Item 42 is open.
    - Today: `HandScreen.tie`, `HandScreen.postBox`, and the Suspense line of item 76 a.

11. **Set Aside, in place.**
    - What: Set Aside opens a panel in the body, with no dialog (`no-native-dialogs`). It offers only the choices that apply. Record in Orphaned shows when the typed cards match nothing. It saves an `envelopes` record with those names. Leave It Short shows when an open envelope still owes lines; it saves nothing. Not an Order counts the envelope and saves nothing. Keep It Open closes the panel.
    - Gain: an odd envelope leaves the path at once and is accounted for, which the brief asks for.
    - Loss: Record in Orphaned skips the Orphaned composer's note and photo. The person adds them on the Orphaned tab later.
    - Pick: keep it. Departs from: today, where an orphan is recorded only on the Orphaned tab (`OrphanedView`, "+ Record an envelope").

12. **Done is part 7's end of day, reached as a station.**
    - What: "The pile is empty." Below it: "N of N envelopes accounted for", Today's pile, Not normal today, and Across all orders with the masthead's "still missing" line. "All is well." shows when nothing is short (`ux-all-is-well`; deep link `done-well`). Today's transit box follows as the past-transit rows. On the open Duo, Today's pile is on the left page and Not normal today on the right, as part 7 draws them. Card belt adds a double-ruled footing, the ledger sign for a closed sum.
    - Gain: a clear moment of done. It reuses the designed end-of-day view rather than adding a second one.
    - Loss: part 7 opens on an empty query. Here it opens only at the end of the path.
    - Departs from: part 7's opener, which owner item 79 a ruled: the empty query (2026-11-19 23:23 CST; decision `ux-control-earns-place`).

13. **Failure, empty and paused states.**
    - What: a failed save shows a red line over the top of the screen with Try Again. It adds no row, so nothing moves under the finger, as today's `hand-checkin-error` overlay works. With no order owed, the first screen says so in one sentence, with one control. Pause shows Packages with Resume Mail Day and a line that names the exact place.
    - Pick: keep it.

14. **AX5.**
    - What: at AX5 the rail folds away, because the count line carries the step. The whole screen scrolls. The dock, holding the act and the field, stays pinned above the keys. Set Aside moves to the foot of the body.
    - Loss: with the keys up, the answer sits under the dock. The person scrolls, or closes the keys, to read it.
    - The tab bar labels stay at the default size, as `duo-card-in-hand` rules.

15. **Motion.**
    - What: none beyond a colour fade on a check box or a station mark. No row slides. Reduced motion draws the final frame (`motion-reduced-leaves-it-drawn`).

## Self-review against the design-review skill

This lane cannot spawn reviewers, so this is the designer's own pass over the house checklist. It is not the review.

- Native or web-like, per pose. Duo folded: native, with one column, a thumb row and the system keys. Duo open: native, with one list beside its detail, by size class. Phone: native. AX5: native, but dense; the dock covers the answer while the keys are up.
- `ux-label-once`: measured. `python3 ~/.claude/lint/label_once.py` ran on the folded frame of each of the 21 deep-link states, dumped from a headless render on 2026-11-21. It printed nothing. The "Not normal today" rows drop "Still owed here", and the Sort screen drops its second "in piles" line.
- `ux-control-earns-place`: a button that is off carries its reason inside it, on a second line, such as "Open Pile 1: 1 not in a pile yet."
- `no-layout-shift-under-pointer`: a failed save is an overlay at the top of the screen, so no row moves.
- Structure: `new`. The mockup replaces today's tabs-plus-control with one modal path, and today's first screen with Bring In.
