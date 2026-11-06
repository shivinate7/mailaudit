# Recent log, Ledger tab: design notes

Mockup: `recent-log.html` beside this file. Open it from disk. Plan: `recent-log-web`. Decision: `recent-checks-can-be-undone`.

Sizes: 375 and 760 wide, 812 tall, from `WIDTHS` in `test/screens.mjs`. `layout.py devices` printed `unknown` for this repo, so the sizes come from the screens check. Theme: one. The app has no dark palette and no `prefers-color-scheme` rule, so the mockup draws light only.

Deep links: `#s=closed`, `#s=open`, `#s=long`, `#s=all-inert`, `#s=closing-empty`, `#s=hidden`. Add `&w=375`, `&w=760` or `&w=both`. Options: `&v=static|count|time`, `&photo=line|cell`, `&mode=inflow|overlay`, `&strike=on|off`, `&hide=close|tab`.

Measured in headless Chromium at both widths: every row is 72px, every day heading is 28px, the panel list stops at 360px and scrolls inside, the right cell is 72px wide, and an UNDO press moves none of the 33 row and text boxes in view. No frame scrolls sideways.

## Choices

1. **Entrance.** A `LedgerRow` labelled Recent, directly above History in the Data card, with History's caret (`aria-expanded`) and accent mono value. Read from `src/app.jsx`, `LedgerRow` and `label="History"`. Gain: it is the same control as every other cell on the tab. Loss: none found. Pick: this. The plan already records the departure from "Where the entrance sits".

2. **Row value** (`#recent-value`). Options: `Undo a tap` (fixed words), `3 to undo` (live rows, read when the tab is entered), `Last 14:32` (newest action). Gain of the count: says how much can be undone. Loss: a number the owner must read, and it freezes while the panel is open. Gain of the time: points at the last tap. Loss: it repeats the panel's first row. Pick: `Undo a tap`. It says what the row is for, as `Saved versions` does for History.

3. **Panel placement** (`#panel-mode`). Options: in the flow under the Recent row, pushing History down, with the card fill, as `historyOpen` and `panelWrap` do today. Or an overlay with the paper fill that covers History and the rows below. Gain of the overlay: it is the ruled behaviour, and no row moves. Loss: it covers History, Re-import and Backup while open, and the paper fill's square edge inside a rounded card is unmeasured. Pick: in the flow, so Recent matches History until the overlay is built for both.
   Departs from: `motion-disclosure-panels-arrive` (panels overlay the list) and `ruled-head-panels-carry-no-fill` (overlay panels take the paper fill). Both are unbuilt (debts `panels-overlay-unbuilt`, `panel-paper-fill-unbuilt`). Not blocking. Owner grant: yes.

4. **Row geometry.** One fixed height of 72px: a 14px line (micro-label left, time right, mono 10px), a 22px line (Cochin 16px subject, mono figure such as `1 of 4`), an 18px line (Cochin 13.5px seller in inkSoft). Each line is cut with an ellipsis. Gain: a long name never changes the height. Loss: three lines cost more height than History's one-line rows, so about four rows show at once. Pick: this. The decision asks for both the label and the seller line.

5. **Right edge.** One fixed 72px cell. `UNDO` is accent mono 11px with a 1px `line` underline, as `valUnder` draws it. Its hit area is the whole 72 by 72px cell. End states are two lines of mono 10px inkSoft: `UNDONE / 14:35`, `CHANGED / SINCE`, `NOTHING / TO UNDO`. Gain: no state is wider than the cell, so the subject's ellipsis never moves on a press. Loss: the end states break over two lines. Pick: this. inkSoft on card is 5.24:1. Gold is not used.

6. **Photo not restored** (`#photo-note`). Options: on the seller line, in manilaInk mono, while the right edge reads `UNDONE`. Or as two more lines under `UNDONE` in the right cell. Gain of the seller line: the right cell stays two lines. Loss: that one row hides its seller. Gain of the cell: the seller stays. Loss: four lines fill the cell, 56 of 72px. Pick: the seller line. The note appears only on an undone discard or assign, where the subject is the envelope's note.

7. **Undone subject** (`#undone-strike`). Options: struck through, or plain. Gain of the strike: a struck ledger line reads as cancelled at a glance, even with the right edge out of view. Loss: the name is a little harder to read. Pick: struck through. The decision does not ask for it.

8. **Day headings.** Mono 10px uppercase over a hairline, 28px fixed, `TODAY`, `YESTERDAY`, then a date such as `TUE NOV 3`. The heading sticks to the top of the panel's scroll. Gain: the owner always knows which day the rows belong to. Loss: none found. No expander, as ruled.

9. **Panel height and scroll.** The list stops at 360px: one heading and four rows, with the fifth row cut so the scroll shows. The list does not contain overscroll, so a swipe past its end scrolls the page. Gain: on a 375px phone with a seeded ledger, the Recent row would sit near y 509 (estimated: History's y 313 in today's empty-ledger page, plus the View card), so the open panel reaches about y 881, under the bottom bar at y 736. The page scroll brings it up. Contained overscroll would trap the swipe inside the panel while its last rows sit under the bar. Loss: a swipe at the end of the list moves the page. Pick: no containment. The page does not scroll by itself when the panel opens, because that would move the row under the finger.

10. **Frozen rows.** As the plan picks, rows freeze at open. An undo changes only its own row's right edge and strike. `#s=all-inert` shows the panel after the last live row is undone: the row and the panel stay.

11. **Closing with nothing live** (`#close-empty`, `#s=closing-empty`). The plan re-reads `isLive` when the panel closes. When nothing is live, the Recent row then goes, and History moves up 52px into the slot under the finger that just pressed Recent. A second tap opens History. This breaks `no-layout-shift-under-pointer`. Option: keep the Recent row until the next Ledger tab entry, still opening its frozen panel. Gain: nothing moves under the finger. Loss: for the rest of the visit, the row opens a panel with nothing to undo. Pick: keep it until the next tab entry.
    Departs from: the plan `recent-log-web`, "An open panel when the cell would hide" (the re-read on panel close). Not blocking. Owner grant: yes.

12. **Repeated word.** `UNDO` shows on every live row. `ux-label-once` may flag it. It is one control per row, the decision's ruled word, so the notes treat it as data.
