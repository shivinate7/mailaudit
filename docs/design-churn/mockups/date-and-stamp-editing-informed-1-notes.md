# Date and stamp editing, informed designer 1: design notes

Designer kind: informed. Mockup: `date-and-stamp-editing-informed-1.html` beside this file. It opens from disk, with no server and no network. Every frame is a working prototype: each tap changes that frame alone.

## The pain

"I marked it on the wrong day." Three jobs fail today:

- **Received day.** The app records when a card was checked (`receivedAt`, written by `touchReceived` in `src/app.jsx`), but no screen shows it and nothing can move it. The RECEIVED stamp in `PackageCard` carries no date.
- **Stamp.** A stamp is dated the day it was set (`nextStamp` in `src/view-rules.mjs`). No control moves that date. Picking another kind re-dates the stamp to today, and the editor does not say so before Save.
- **Range.** `RANGES` in `src/app.jsx` offers presets, "Last…" and one month at a time (`pickMonth`). A span of two months needs the two native `<input type="date">` fields behind Exact dates. Every pick applies at once, with no count shown first.

## Devices, sizes and themes

- iPhone Duo folded, 466 × 678 pt, then open, 951 × 669 pt, with the fold from x 455.5 to 495.5. `layout.py devices` printed `unknown` for this repo, so both sizes come from the brief. Nothing sits across the fold.
- Large phone, drawn at 375 × 812. No size is written for it anywhere: not in the brief, not in `layout.py`, not in the repo. 375 × 812 was the phone size `test/screens.mjs` checked before the three forms (as `recent-log-notes.md` records). A real large phone is wider, so this is the worst case for width.
- Folded at AX5. Body 53 pt against 17 pt at the default size, from the typography page. Every Cochin and mono size is scaled by 53/17. The tab bar labels stay at the default size, as `duo-card-in-hand` caps them.
- One theme, light. The app has no dark palette (`design-parchment-ledger`), and the native client is held to light.
- Status bar and home-indicator bands: no Apple page I read gives them. Both are drawn at the 20 pt floor the Duo UI tests use (`DuoHandUITests.statusBarFloor`). Unmeasured.

Apple pages read 2026-11-21 through the `tutorials/data` JSON, each answering 200: layout, typography (the Large and AX5 Dynamic Type tables), accessibility (44 × 44 pt default control), buttons, sheets (Cancel on the leading edge), pickers (the compact, inline and wheels date picker styles), tab bars, undo and redo ("help people predict the results of undo", "show the results of an undo").

## Deep links

`#c=<concept>&s=<state>`. Add `&d=f|o|p|ax` for one device (folded, open, phone, AX5), `&kd=keep` for item 6's "Keeps its date", and `&ex=fields` for item 13's "Two date fields".

- Correction slip: `rest`, `recv`, `recv-picked`, `recv-saved`, `stamp-kind`, `stamp-day`, `remove-armed`, `recent`, `range`, `range-picked`, `range-applied`.
- Daybook: `rest`, `open`, `lifted`, `moved`, `stamp-lifted`, `two`, `posted`, `undone`, `range`, `range-picked`.

Option controls: "Hide Correction slip" and "Hide Daybook" each remove one concept. Focus ids, one per frame: `slip-duo-folded`, `slip-duo-open`, `slip-phone`, `slip-duo-folded-ax5`, and the same four with `daybook-`.

## Choices

1. **Concept: Correction slip** (`#c=slip&s=recv-picked`, focus `slip-duo-folded`). The fix stays in the card. The RECEIVED stamp gains its day (`RECEIVED · 11-18`, the format of `stampBandText`) and opens a received-day editor, as the stamp band opens the stamp editor (`stamp-band-opens-the-editor`). Gain: no new screen, and both stamps work the same way. Loss: one package at a time, and the editor pushes the card's lines down when it opens, as the stamp editor does today. Pick: this one, to build first. It is the smaller change and keeps every entrance.

2. **Concept: Daybook** (`#c=daybook&s=two`, focus `daybook-duo-folded`). The bold one. One sheet holds every date of one package, a ruled row per day from its order to today. Tap a stamp to pick it up, then tap a day to put it down. The old place stays as a struck ghost, so no row moves. The slip lists every change waiting. Post writes them all, and one Undo takes them all back. The same rows pick a range: tap the first day, then the last. Gain: one gesture for all three jobs. A day row is a list row, so it reflows cleanly at AX5, where the week of day cells must stack. On the open Duo, the card on the left page shows each waiting change as a dashed stamp. Loss: a new screen and a new gesture to learn. The kind of a stamp moves into the slip. Pick: keep it for the owner to look at. Owner grant: yes. Departs from: `stamp-band-opens-the-editor` (the band opens the in-card editor). Here it opens the Daybook.

3. **Received day on the RECEIVED stamp.** The stamp reads `RECEIVED · 11-18 ›`, and its 44 pt box opens the editor. Its click stops at the stamp, as the order-id link's does (`order-id-button-stops-propagate`). Otherwise it would also fold the card. Gain: the day shows wherever the package does. Loss: the stamp gets wider; at 375 px the header's seller name has about 60 px less room. Pick: this. Owner grant: yes. The stamp is the ledger's own verdict, and this adds a control to it.

4. **Where the corrected day lives.** `receivedAt` is the merge clock: the later time wins a merge, and the Recent log's guards read it (`recent-checks-can-be-undone`, How one tap undoes one action). Back-dating it would make a stale copy on the other device win, and would make Recent rows read `NOTHING TO UNDO`. So the mockup assumes a new optional ledger field: one day per package key (`gkOf`), with its own `updatedAt` and a tombstone, like `stamps`. With no entry, the day shown is the local day of the package's newest `receivedAt`. Gain: the merge clock stays honest. Loss: a new persisted key. That means the five sites in `src/app.jsx`, a named line in `mergeLedger`, a new Recent row kind, the native raw-JSON path and the rules bundle. Pick: the new field. Owner grant: yes. It changes the invariant `saved-state-shape`. A builder needs the ruling before any code.

5. **The week of day cells.** Seven 44 pt cells under a week label with ‹ and › arrows, both 44 × 44 pt. A day before the order date or after today is drawn dashed and answers a tap in the slip ("Sun Nov 1 is before the order"), never in a native alert (`no-native-dialogs`). The current day carries a `now` mark. Gain: no keyboard; it cannot express 2026-02-31, as `ruled-head-range-picked` wants. Loss: a day more than a week back takes one arrow tap per week. Pick: this. The system compact date picker was the other option, but its pop-over covers the card and its calendar shows no order date.

6. **A new kind and the stamp's date** (`&kd=redate` or `&kd=keep`, focus `slip-duo-folded`, state `stamp-kind`). Today a new kind takes today's date (`nextStamp`, `at: cur?.kind === patch.kind && cur.at ? cur.at : today`). "Takes today's date" keeps that rule and says so in the slip: "A new kind takes today's date. Tap Thu 12 to keep Nov 12." "Keeps its date" keeps the stamp's date unless the person picks a day. Gain of "Takes today's date": no change to a ruled behaviour. Loss: the owner, correcting a wrong kind, re-dates the stamp by accident. Gain of "Keeps its date": a correction stays a correction. Loss: a real new event, such as a refund that came today, needs a day tap. Pick: "Takes today's date", with the slip. Departs from: nothing, for "Takes today's date". "Keeps its date" departs from `one-stamp-per-package` ("Picking another kind replaces the old stamp, and it re-dates the stamp"). Owner grant: yes, for "Keeps its date".

7. **The stamp's date can move.** A Dated row of day cells in the stamp editor. Gain: the owner can fix "I stamped it on the wrong day". Loss: `at` no longer means "the day it was set". Pick: this. Owner grant: yes. Departs from: `one-stamp-per-package` ("A stamp is dated the day it was set").

8. **The slip.** A manila panel of fixed height between the picker and the buttons. It shows the change as before → after, in mono, with the old value struck. Under that it gives the effect in plain words. A refund kind says "4 cards, $1.46, leave every count and the list" (`a-refund-leaves-every-count`, `isRefundStamp`). A day move says "Counts, cost and lost-mail flags do not change". That is true: the lost-mail flag reads the order date and a stamp, never the received day (`lost-mail-flags-use-order-date`). Gain: the person sees the change before it happens, which is the brief's first ask. Loss: about 76 pt of height in each editor. Pick: this. Its fixed height means no state of it moves the buttons. That was checked in headless Chrome: the Save box held still on every pick.

9. **The Save label names the act.** "Move to Nov 16" in the received editor. The stamp editor keeps "Save" (`stamp-band-opens-the-editor`). The primary button keeps the width of its widest label (160 pt), so the label change moves nothing (checked). The disabled button points at the slip for its reason (`ux-control-earns-place`). Pick: this.

10. **Remove stamp sits on its own row.** The armed label "Tap again to remove stamp from 4 cards" is about 300 pt wide. In today's row it pushed Cancel sideways. The headless check measured a 63 pt jump at 466 pt, which `stamp-band-opens-the-editor` lists as unmeasured. The mockup puts Remove on its own row under a dashed rule, so arming moves nothing (checked). Gain: no mis-tap on Cancel. Loss: one more 52 pt row. Pick: this. Departs from: the web editor's one action row (`PackageCard`, `confirmRemove`). Native already hangs the ask below the row for the same reason.

11. **Undo, one tap, two places.** After Save, a receipt line of fixed height sits in the card: "Saved. Moved from Wed Nov 18. Undo". The same change is a Recent row with `UNDO`. Both run one function and write the old value as a new, later write, never a rollback (`recent-checks-can-be-undone`, `undo-removes-only-its-delta`). If anything changed the subject since, the row reads `CHANGED SINCE` and does nothing. After Undo the receipt reads "Put back. Back on Wed Nov 18." at the same height, so a second tap lands on still text (checked: the lines below held still). Gain: the undo sits where the press was (`ux-answer-at-press`), and Recent keeps it after the card closes. Loss: two places say one thing. Pick: this. The receipt goes when the card folds or the view changes. Owner grant: yes, because the receipt is a new in-card line beside the ruled Recent entrance.

12. **Recent row words.** `RECEIVED 11-18 → 11-09` for a day move, and `STAMP · <KIND>` for a stamp, as ruled. The second line names what it was. Pick: this. The decision's micro-label list gains the new one.

13. **Range, Exact dates: "Two-tap calendar" or "Two date fields"** (`#c=slip&s=range-picked&ex=cal` or `&ex=fields`, focus `slip-duo-folded-cal` or `slip-duo-folded-fields`). "Two date fields" is today's pair (`dateInput` in `src/app.jsx`), and each change applies at once. The mockup only adds the count slip under it. "Two-tap calendar" sits in the same place, behind Exact dates and under By month. It is a month grid of 44 pt days with a dot on each day that holds orders. The months come from the ledger, as today. Tap the first day, then the last, which may be in another month (‹ and › move the month; the first pick stays). The slip shows the new range and its count: "21 packages show, 45 go outside. Packages and Tally both follow." "Show 21 packages" applies it. The presets and month chips still apply on one tap, as `RANGES` does today. Gain of the calendar: a span of months with no keyboard, and the count before the list changes. Loss: a calendar is taller than two fields (about 300 pt). Gain of the fields: the ruled control, and they now carry a count. Loss: no preview before it applies, and the fields' ~140 px minimum width. Pick: the calendar. Departs from: `ruled-head-range-picked` ("The native date pair survives behind an Exact dates disclosure"), for the calendar only. Owner grant: yes, for the calendar.

14. **Back to the last range.** After a range applies, the panel's first line reads "Oct 27 – Nov 14 · 21 packages" with "Back to November 2026". A range is a view choice, not ledger data, so it is not a Recent row. Pick: this. The line keeps the panel's height across the press.

15. **Open Duo, Correction slip.** Packages sits on the left page. The editor and Recent sit on the right page, beside the card they change, and the card carries an accent edge while its editor is open. Gain: list beside its detail, as the layout page asks. Loss: Packages spreads over two pages. Departs from: `duo-card-in-hand` ("Packages does not spread on the open Duo", a default, not owner). For the range, nothing new goes on the right page. The built app's Ledger does not spread (`DuoSpread.spreads(tab: .ledger)` is false, pinned by `testLedgerFullWidth`), so it draws one page across the whole window, fold included. The brief says nothing may sit across the fold. The mockup draws the one Ledger as two columns, View on the left page and Data on the right, and keeps the range panel whole on the left. Owner grant: yes. Two rules clash here: "Ledger stays full width" (`duo-card-in-hand` round 2 item 24 b) and the brief's fold rule. The Daybook's range sheet takes the right page, a second departure from item 24 b.

16. **Daybook, Cancel with changes waiting.** Cancel arms in place: "Tap again to drop 2", 4 s, the same as the web's two-tap arm (`setTimeout(disarm, 4000)`). The leading button keeps a fixed width, so the title does not move. Pick: this. With nothing waiting, Cancel closes at once.

17. **Daybook, the Ordered entry is fixed.** It shows a lock. A tap answers in the slip: "Order dates come from your CSV, so they stay put." The order date feeds the lost-mail flags and comes from `parseItems`. Imports merge and never replace (`imports-merge-never-replace`), so an edit would be a third source. Pick: fixed.

18. **Daybook, drop slots.** While a stamp is picked up, each day row shows a dashed slot, a shape with no word. The slip says once where to put it (`ux-label-once`: the first draft printed "Put here" on 20 rows). Pick: this.

19. **Daybook, a new kind.** When the stamp is picked up, the six kinds sit in the slip, in the editor's chip style, with Remove stamp on its own row. Item 6's rule applies here too.

20. **Haptics** (`ux-haptics-feel-substantial`). A light impact on each day pick and on put-down. A success notice on Save, Post and Undo. Drawn as notes only, since a web mockup cannot feel. Pick: this, for the native client.

21. **Daybook opens with the tapped stamp already picked up.** A tap on `RECEIVED · 11-18` opens the Daybook with that stamp picked up. A tap on the stamp band opens it with the stamp picked up and the six kinds in the slip. "I marked it on the wrong day" is then two taps and Post. Gain: the kind fix is never hidden behind a gesture the person must already know. Loss: none found. Pick: this. The critique found this one.

## Critique (impeccable `critique`, run in one context, since a designer cannot spawn)

The score is 29/40 (Good). Visibility of status 3, match with the real world 3, control and freedom 3, consistency 3, error prevention 3, recognition 3, flexibility 2, minimalism 3, error recovery 3, help 2. The detector flagged one item, a cream page background. That is a false positive: it is the repo's ruled parchment palette (`design-parchment-ledger`). No browser overlay ran, since that needs a live server and a person's tab.

- P1, fixed: in the Daybook, the kind fix sat behind a pick-up gesture (item 21).
- P2, fixed: the Ordered entry used an emoji padlock. It is now drawn in ink.
- P2, fixed: "Put here" was printed on 20 rows (item 18).
- P2, open: in the Daybook range rows, a start day two months back is about 60 rows of scroll on the phone. There is no month jump. The Correction slip calendar has one.
- P2, open: the received editor's week moves one week per tap. An order more than three weeks old takes three taps.
- P3, open: at 375 px the RECEIVED stamp with its date leaves the seller name about 60 px less room.

## Not drawn

- Order dates cannot be edited, in either concept (item 17).
- The Tally source row shows no received day. The day belongs to a package, and Tally pools across packages.
- Native parity rows, the rules bundle and the Swift writer are builder work after the ruling in item 4.
- Partial receipts: when a package's cards came on two days, the stamp would read `RECEIVED · 11-16 +1`, and the editor would move them all to one day. Not drawn. Input needed if it matters.

## Self-check (skill `design-review`, applied to my own mockup)

- `native` or `web-like`. Correction slip: native in structure, with inline editors, 44 pt targets, a floating tab bar and system-font chrome. It is web-like in one place: the in-card action buttons are a row of bordered web buttons, as the app has today. Daybook: native, with a sheet that has Cancel on its leading edge, list rows, and a pinned bottom action.
- Structure verdict, for the Mockup set check: Correction slip is `same` (today's card, editors and range panel, plus parts). Daybook is `new` (a new sheet and a new gesture).
- `label_once.py` on rendered states: "Put here" ×20 is fixed (item 18). "Gamma Cards" ×2 is data: the card under the sheet, and the sheet title.
- `check_ios_mockup.py`: safe-area and Duo frames pass. It fails `system-font` on Cochin. That is a possible false alarm: `typography-cochin-and-mono` rules Cochin for this app's words, the native client uses `Font.cochin`, and the repo's own `duo-hand-post-sender.html` fails the same way. The chrome (status, tab bar, sheet toolbar) is set in `-apple-system`.
- Tap checks in headless Chrome through the DevTools protocol: no script error. None of these presses moves another element: a day pick (Save box), an arm (Cancel box), an Undo (the lines below), and a put-down (the day row below). The page never scrolls sideways (1085 px document in a 1100 px window). All eight frames measure their stated sizes.
