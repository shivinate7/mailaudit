# Undo recent ticks: blind designer notes

Designer kind: blind. Designer: undo-recent-blind-2. Mockup: `undo-recent-blind-2.html` in this folder.

The job, from the brief: a person mis-taps a card. They must see the last several ticks and undo
any of them with one tap, minutes later, without hitting another control by mistake. Each tick has a
card, an order, a time and a device. The undo control never sits under the bottom bar and never
moves when something opens.

Deep links: `#c=shelf`, `#c=recent`, `#c=replay`; states `s=loaded|undone|empty|loading|failed` (`s=error` reads as `failed`);
theme `t=light|dark` (no `t` follows the system). Example: `#c=replay&s=undone&t=dark`.

Sources: Apple HIG pages layout, typography, accessibility, buttons, sheets, lists-and-tables,
tab-bars and toolbars, read 2026-11-21 as JSON (each answered 200). Type sizes come from the
typography page's Large (default) and AX5 tables. The 44x44 pt target comes from the accessibility and buttons pages.

## Concepts

1. **Shelf.** The last three ticks sit on a fixed shelf above the tab bar, on the screen where the
   person ticks. See all opens a sheet (folded) or fills the right page (open). Focus: `#shelf-folded`, which is present in every state.
   - Gain: no new screen and no hunt. The fix is in reach while the mail is still in the hand.
   - Loss: the shelf takes about a third of the folded screen, so the checklist shows fewer rows. Ticks older than three need one more tap (See all).
   - Pick: strong second.
2. **Recent tab.** A screen of its own, one tab away. It lists every tick of the day, newest first. Undo sits in its own column at the
   thumb edge. A row body opens the order (sheet when folded, right page when open), so the person
   can tick the card they meant. Focus: `#recent-folded`.
   - Gain: one place that answers "what did I tick", across devices, as long as the day.
   - Loss: a tab switch away from the checklist, and the person must know that the tab exists.
   - Pick: safest. It is the most familiar to a confused person.
3. **Replay (bold).** Each tick replays the list as it looked at the moment of the tap, with a ring
   where the finger landed. The rows next door carry "Move tick here", so undo and re-tick is one
   press. After a move, the dock reads "Undo move", and one press puts the tick back where it was.
   Earlier and Later step through taps. Focus: `#replay-folded`.
   - Gain: it answers "I tapped the wrong card" in the person's own terms. They see the wrong row and the right one together.
   - Loss: it is a new idea that people must learn. It also needs the app to store each tap's list order (see item 10).
   - Pick: my pick for the mis-tap job. Shelf is my pick if the owner wants no new screen.

## Choices

4. **Undo is the only control that changes a tick.** A row body opens detail or See all. It never ticks or unticks.
   - Gain: a stray tap on a row costs nothing.
   - Loss: one more control to aim at.
   - Pick: yes.
5. **Undo keeps its box.** The box shows an arrow with the word "Undo" under it (Caption 2), because a confused person may not read an arrow alone. A press turns it into "Tick" in the same 56 x 52 box. The row keeps its slot. No toast and no inserted line. The undone row turns dashed and violet and shows the time it was undone.
   - Gain: nothing moves under the finger, and a second press reverses the first, so a wrong undo costs one tap.
   - Loss: undone rows stay in the list until the day ends.
   - Pick: yes. The headless run measured the box and the next row before and after a press, and both held still.
6. **A dead strip before undo.** A 16 pt gap sits between the row text and the undo box. An 8 pt gap sits between rows and between shelf slots, so two undo boxes never touch. Undo is violet, a colour no tick uses, and is never the system red (undo is not destructive).
   - Gain: fewer near misses.
   - Loss: card names get less width.
   - Pick: yes.
7. **Scroll ends above the tab bar.** The list ends above the floating bar. Content never runs under the glass, so no undo can sit under the bar.
   - Gain: meets the brief's rule. Loss: about 70 pt less list than a full-bleed list.
   - Pick: yes. A headless check confirms the content box ends above the bar.
8. **Undo works on ticks from other devices.** A tablet's tick can be undone from this phone. Each row names its device, and a filter shows All devices or This phone.
   - Gain: a mis-tap on the laptop can be fixed from the phone in hand.
   - Loss: one person could undo another person's tick.
   - Pick: yes. Owner grant: yes.
9. **How long ticks stay undoable.** The mockup keeps the whole day. Shelf shows three, and See all shows the day.
   - Gain: covers "a few minutes later" with room to spare.
   - Loss: a longer list to scan.
   - Pick: the day. Owner grant: yes, because the window is a product rule that I cannot see.
10. **Replay needs the list order at tap time.** The data shapes in the brief give card, order, time and device. Replay also needs each tick to keep its row's neighbours (or the list order and a sort key). Without that, Replay shows the order's current list, which may differ.
    - Gain: a true replay. Loss: a new field in each tick.
    - Pick: report to the orchestrator. Owner grant: yes, because it changes the data shape.
11. **Shelf freezes during a touch.** A tick from another device that arrives live would push the shelf slots down under a finger. The shelf shows a new remote tick only after the person lifts their finger. Its height is fixed in every state, empty included.
    - Gain: the shelf never moves under the finger.
    - Loss: a remote tick shows a moment late.
    - Pick: yes (not drawn; a builder note).
12. **States.** Each concept draws loading, failed, empty and loaded as different states. A failed read says "Until they load, this list is unknown, not empty," with Try again and a closed "What the server said". With no data, the filter is hidden. Shelf's empty state has no button of its own, because the checklist above it is the control that fills it.
    - Gain: a failed read is never shown as an empty list.
    - Loss: none.
    - Pick: yes.
13. **Largest text (AX5).** Recent stacks each row and gives undo a full-width button with its word. The filter and the long hint step aside. Shelf drops to one slot, with the name on one line and an 80 pt undo box. Replay keeps the tapped row in view and shortens its caption.
    - Gain: undo stays reachable and above the bar.
    - Loss: at AX5 the filter is gone from the Recent screen.
    - Pick: yes.
14. **Haptics.** Undo and tick-again give a light haptic. Move tick here gives a medium one.
    - Gain: the person feels that a press counted.
    - Loss: none.
    - Pick: yes. The design reviewer checks it on the phone.
15. **Open Duo.** Each pose has its own layout. Shelf puts the checklist on the left page and the full tick list on the right. Recent puts its list on the left and the order on the right. Replay puts the tap list on the left and the replay with its undo dock on the right. The tab bar sits on the left page only. Nothing crosses x 455.5 to 495.5.
    - Gain: the fix and its context show side by side.
    - Loss: none.
    - Pick: yes.

## Gaps and labels

- Large phone size: the brief, `layout.py devices` (it printed `unknown`) and the Apple pages I read give no size, so the phone is drawn at 440 x 956 pt as a stand-in. Owner grant: yes, to name the size.
- No "Today:" labels. A blind designer sees no current screen, so every marked part is "New:". The marks show on the shelf, the Recent title and the Replay undo dock. The Labels control hides them.
- Tabs "Cards", "Orders", "Recent" and "Replay" are placeholders, because I do not know the app's real tabs. Every tab works. Cards shows a sample checklist, and a tick there lands at the top of the concept's list. Orders opens an order's checklist.
- The hinge holds by construction: each page is its own grid column with hidden overflow. No test measures it.
- Hide: each concept has a Hide control in the concept bar and in its heading. "Show hidden concepts" restores them.
