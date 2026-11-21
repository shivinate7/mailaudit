# Date and stamp editing, directed designer 1

Designer kind: directed. Direction: calendar-first: pick on a calendar, see the effect live.

Mockup: `docs/design/date-and-stamp-editing-directed-1.html`. Open it from disk. Deep links set the job and the state for every frame: `#j=received|range|stamp&s=<state>`. States: `rest`, `open`, `picked`, `why` (received), `empty` (range), `refund` and `armed` (stamp), `saved`, `undone`. `hide=sheet` or `hide=ledger` hides a concept; `tags=off` hides the Today and New tags. Focus ids: `#opt-sheet` and `#opt-ledger`.

Frames, in order: iPhone Duo folded (466 x 678 pt, from the brief and measurement `duo-fold-and-keyboard`), iPhone Duo open (951 x 669 pt, fold strip x 455.5 to 495.5, nothing crosses it), large phone (no size written anywhere: drawn at 420 x 880 pt, my pick), and the folded Duo at the largest accessibility size. One theme: the web app and the native client ship light only (`design-parchment-ledger`).

Apple pages read 2026-11-21, each answered 200, through the `tutorials/data/...json` form: layout, typography, accessibility, sheets, pickers, buttons, toolbars. Numbers used: 44 x 44 pt default control size (accessibility), Dynamic Type Large body 17, headline 17, subhead 15, title 3 20, and AX5 body 53, headline 53, subhead 49, title 3 55 (typography). Cancel on the leading edge of a sheet's top toolbar, Done on the trailing edge (sheets). A date picker's values and their order depend on the device location (pickers).

## Choices

1. **Concept: Calendar sheet** (`#opt-sheet`). Tap the value to correct: the received day, the stamp band, or the Dates cell. A sheet opens on a month with that value marked. Tap the right day. On the open Duo the editor takes the right page, and the left page shows the package changing as you tap. Gain: it opens from the thing you are correcting, so the answer shows at the press (`ux-answer-at-press`). It works the same in every pose. Loss: one more layer, and Save sits at the top of the sheet. Pick: this one.

2. **Concept: Ledger calendar** (`#opt-ledger`). The month is the surface. Each day carries its marks: orders placed, cards received, stamps set. Tap a day to read it. Pick a mark up with Move or Edit, then tap the day it belongs on. The month and one action bar sit in the thumb zone. On the open Duo the month fills the left page and the day's ledger fills the right. Gain: it answers "what happened on the 18th" for free, and a wrong day is visible as a mark on the wrong day. Loss: on the folded pose the day's ledger gets about 160 pt, so the stamp kinds need a scroll. It is a new way into the ledger, so it needs a home (a mode of Packages, here). Pick: not this one, but keep it for the owner to cull.

3. **The received day shows on the card.** A new 48 pt row, `Received 18 Nov ›`, on each card that has a card in. With cards from two days it reads `20 Nov and 1 other day`. Gain: the value you want to fix is visible and tappable. Loss: one row per card with any card in, so the list is longer. Departs from: no screen shows `receivedAt` today (`src/app.jsx` card, `native/Manifest/PackagesView.swift`). Owner grant: yes.

4. **A received-day fix needs its own field.** `receivedAt` is the per-card merge clock: the later time wins (`max-cannot-express-an-uncheck`, `merge-later-change-wins`). A fix that moves it earlier loses to any copy with a later time, so the other device would undo the fix. Option: a new optional key that holds the corrected day per card and its own change time, merged by the later change. That is five sites in `src/app.jsx` and a named line in `mergeLedger` (`saved-state-shape`). Option: rewrite `receivedAt` in place. Gain: no new key. Loss: the merge loses the fix. Pick: the new key. Owner grant: yes (changes `saved-state-shape`). The builder cannot start the received job without this ruling.

5. **Which cards move.** Calendar sheet lists the cards received that day, all ticked; untick one to leave it. Ledger calendar moves all of the package's cards from that day. Gain of the list: the rare split day is fixable. Loss: one more list in the sheet. Pick: the list, all ticked, so the common case is one tap and Save.

6. **Days that cannot be picked.** Days before the order date and days after today are greyed. A tap on one writes why in the correction box: `5 Nov is before this order was placed (9 Nov).` Gain: a disabled control says why (`ux-control-earns-place`). Loss: none found.

7. **The correction box.** The old value struck in red, the new one written beside it with an accent rule, then what else changes. It sits above the month, with a reserved height, so a tap writes into it and moves nothing below. A refusal line also lands inside it. Gain: you see the exact change before Save, the way a bookkeeper strikes and writes beside, never erases. Loss: about 96 pt at the top of the sheet. Pick: this.

8. **What the box claims.** Only what the app does (`ux-statements-are-true`). Received day: nothing computed changes, because the lost-mail flag counts from the order date (`lost-mail-flags-use-order-date`). Range: the new package count, cards in and still-missing money, against today's. Stamp: Refunded or Partial refund leaves every count, with the still-missing line before and after (`a-refund-leaves-every-count`); removing a stamp brings the lost-mail flag back (`stamped-package-hides-lost-flag`); any other kind changes no count.

9. **Range on a day calendar.** Tap the first order day, then the last. The five spans stay as chips: All time, 30, 45, 60 and 90 days. Gain: any span in two taps, picked and never typed, so the reason in `ruled-head-range-picked` still holds. Loss: a whole month takes two taps instead of one. Departs from: `RANGES` in `src/app.jsx` (seven options: `Last…` takes a typed day count, `By month` opens the month picker) and the Exact dates disclosure. Owner grant: yes (changes `ruled-head-range-picked` and `date-filter-spans-ledger-views`). The native client has no date filter yet (debt `native-filters-tally-only`), so there it is new.

10. **Live tallies.** While a span or a refund is pending, the masthead tallies and the still-missing line turn accent with a dashed underline. Cancel puts them back. They follow `masthead-tallies-unequal-thirds`: cards, packages, value at 1 : 1 : 1.7, then the exact still-missing line. Gain: the effect shows where the owner reads it every day. Loss: a dashed figure might read as a fault. Pick: this.

11. **A span with no orders.** One sentence, `No orders were placed in those days.`, and a Clear dates control. Show is off, and says why on a tap (`ux-unknown-is-not-empty`).

12. **Stamp day.** Today a new kind re-dates the stamp to today, and a note-only edit keeps the date (`nextStamp`, V36). The calendar keeps that as the default: a new kind moves the selection to today, live. A tapped day wins. Gain: `I marked it on the wrong day` is fixable for a stamp too. Loss: `nextStamp` needs a day in its patch. Owner grant: yes (changes `one-stamp-per-package`: "dated the day it was set").

13. **Stamp editor parts kept.** Six kinds as 44 pt chips in rows of three, `Other` last (`stamp-band-opens-the-editor`). The two-line note field (owner ruling `stamp-note-two-lines`). The two-tap `Tap again to remove stamp from N cards`, now with its effect written under it. First focus on Cancel.

14. **A refund stamp and the list.** The card stays in place while Refunded is pending. On Save it leaves the list, and a 48 pt row in its slot says `Pewter Owl Games: Refunded, out of every count.` with Undo. Gain: nothing jumps under the finger before Save (`no-layout-shift-under-pointer`). Loss: one row stays until the next act.

15. **Undo where you pressed.** Each Save leaves Undo in the slot it changed: the received row, the stamp band's slot, the Dates cell, or the action bar. No new row appears. Undo takes back only its own change (`undo-removes-only-its-delta`): a card moved again since keeps its new day. A received-day fix and a stamp-day fix each also need a Recent row, such as `RECEIVED DAY 11-18 → 11-17`. Owner grant: yes (adds row kinds to `recent-checks-can-be-undone`). A range is a view preference, so Recent does not log it, as that record says.

16. **Open Duo, Calendar sheet.** The editor is a page on the right, not a sheet, and the left page shows the pending value in accent beside the struck one. Gain: the effect shows on the real card while you tap. Departs from: what the Packages spread holds on the right page today (`DuoSpread.spreads` in `native/Manifest/DuoSpine.swift`); I did not read that page's content. Owner grant: yes, if it replaces Card in Hand there (`duo-card-in-hand`).

17. **Save at the top.** The sheet puts Cancel leading and Save trailing in the top toolbar, as the sheets page asks. Loss: the top of the folded screen is out of one-thumb reach (`ux-thumb-zone`). The Ledger calendar instead puts its one action bar above the month, in reach. Pick: the platform's placement for the sheet.

18. **The month.** Six week rows always, so a month change or a tap never moves what sits below. Marks: an ink rule for an order, a green dot for cards in, a manila square for a stamp. Today has a gold ring (gold is ornament, never text: `palette-gold-is-ornament-only`). The picked day is an accent disc; the old day is struck. Weeks start on Sunday, my pick for a US locale; the pickers page says the order follows the device location. Days are read off the ISO string, never `Date.parse` (`ruled-head-range-picked`, test 23.16).

19. **AX5.** The month grid cannot hold 53 pt numbers in 466 pt. At the accessibility sizes it becomes one week of day rows, each with its marks in words, and Earlier week and Later week buttons. The correction box comes first. The sheet toolbar and the tab bar keep their default size, as system bars do: unverified, no page I read says so.

20. **Haptics.** A selection haptic on each day tap and on Save (`ux-haptics-feel-substantial`). Native only. Not drawn.

21. **Large phone size.** No size is written for it in `layout.py devices`, the brief or the repo. Drawn at 420 x 880 pt, my pick. It uses the folded layout, as the layout page's size-class rule asks for two compact-width screens.
