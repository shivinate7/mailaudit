# Duo poses, blind designer 1: notes

Designer kind: blind. Mockup: `duo-poses-blind-1.html`, in this folder.

As a blind designer I saw no current screen, spec, tokens or other mockup. The brief gave the job,
the devices and the parts: a list of orders, a count, money owed and an input area. Every figure on
the page is sample data.

Deep links take `c` (desk, adder), `p` (folded, ax5, book, laptop, phone), `s` (loaded, typing,
nomatch, arrived, empty, failed or error, loading), `t` (light, dark) and `a=off` (hide the Today and New
labels). Example: `#c=adder&p=laptop&s=typing&t=dark`. `hide=desk` or `hide=adder` hides a concept.

## Sources

- Device sizes: from the brief. `python3 ~/.claude/lint/layout.py devices <repo root>` printed
  `unknown`, so no device size is written in the repo.
- The large phone has no written size in the brief or the device list, and Apple's layout page
  (read 2026-11-21) carries no device-size table in its text. It is drawn at the brief's one-screen
  size, 466 x 678 pt. The owner should name the phone's size.
- The laptop pose is the open pose turned a quarter: 669 x 951 pt, with the hinge gap at
  y 455.5 to 495.5. The brief gives the open pose as 951 x 669; I turned it and invented no size.
- Apple pages read 2026-11-21, each answered 200, through the `tutorials/data` JSON:
  layout (size classes, safe areas), typography (Dynamic Type table: Large default and AX5),
  accessibility (44 x 44 pt default control, 17 pt default text, 200 percent text), buttons
  (44 x 44 pt hit region), sheets (Cancel leading, Done trailing), tab-bars (navigation, not
  actions), toolbars, lists-and-tables.
- Type sizes used: Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline and
  Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16. AX5: 60/70, 58/68,
  56/66, 55/65, 53/62, 53/62, 51/60, 49/58, 44/52, 43/51.
- Stand-ins with no Apple number: status bar strip 28 pt and home indicator area 20 pt, used only
  as the fallback inside `max(env(safe-area-inset-*), ...)`.
- House files: spacing on the 4 px step, 8 px radius, colour by role with a light and a dark set,
  system font. The colours are my own choice.

## Choices

1. **Two concepts, each with its own structure.**
   What: Desk spread is a list with a check-in keypad. Adding machine has no list screen: a keypad
   and a paper roll above it.
   Gain: the owner sees a safe answer and a bold one side by side.
   Loss: two concepts to judge, not one.
   Pick: keep both until the owner culls. Each has a Hide button on the page.

2. **Laptop pose: the answer page on top, the keys on the bottom page.** Owner grant: yes.
   What: in both concepts, the top page shows the count, money still out and the orders. The
   bottom page holds only keys. Nothing sits in the hinge gap.
   Gain: it answers the job's words: "It's a laptop when it's on my desk". The hands stay on the
   keys and the eyes stay on the page.
   Loss: the keys take half the device, so the top page shows about six orders at once.
   Pick: yes.

3. **App keys, not the system keyboard.** Owner grant: yes.
   What: a 3 x 4 digit pad drawn by the app: Clear, 0 and Delete on the last row.
   Gain: the keys stay on the bottom page in the laptop pose, and are big enough to hit without
   looking. The person keys only the last digits from the packing slip.
   Loss: no letters, so no search by seller name from the keys. Folded, the Desk spread can add a
   search field later.
   Pick: digits only.

4. **Match on the last digits of the order number.**
   What: each key press narrows the still-out orders to those whose number ends in the typed
   digits. One match arms Mark arrived. Several matches ask the person to tap theirs. No match
   says so and offers Clear.
   Gain: two or three key presses find most orders.
   Loss: an order not still out never matches. To fix a wrong mark, use Undo, or open the order.
   Pick: yes.

5. **Book pose (open, side by side).**
   What: Desk spread: the list on the left page, the chosen order and the keys on the right page.
   Adding machine: the roll on the left page; on the right page, the packing slip of the match,
   the answer line and the keys.
   Gain: held like a book, the right thumb reaches every key; each pose has its own layout, not a
   folded layout made wider.
   Loss: a tap on the left page answers on the right page, across the hinge.
   Pick: yes. The answer line on the right page sits beside the keys that were pressed.

6. **Folded pose and the large phone.**
   What: Desk spread: a large-title list with a floating Check in button at the thumb, which opens
   a keypad sheet with Done on the trailing edge (Apple's sheets page). The sheet has no Cancel:
   each mark is already saved, and Undo takes it back. A row tap opens the order.
   Adding machine: the same keypad as on the open device, with a short roll above it.
   Gain: the main action sits in thumb reach on a one-hand device.
   Loss: the Desk spread needs one more tap (Check in) before the keys.
   Pick: yes.

7. **Adding machine: the roll and its three keys.**
   What: three keys beside the roll choose what it prints: Still out, Arrived, May be lost. The
   roll ends in a total line: money still in the mail, and the count arrived. The newest line sits
   at the bottom, next to the answer line.
   Gain: no navigation stack and no tab bar. The keys beside the roll are the only way to move.
   Loss: no tab bar, though the house tokens name a bottom tab bar for phone navigation. Here the
   app has no sections, so a tab bar would hold filters, which Apple's tab-bars page rules out.
   Pick: yes. Owner grant: yes, as it departs from the house tab-bar default.

8. **"May be lost" after 21 days.** Owner grant: yes.
   What: an order still out 21 days or more after it was ordered shows "May be lost" in the late
   colour and is counted in the summary.
   Gain: lost mail surfaces without a search.
   Loss: 21 days is my guess, not a ruling.
   Pick: 21 days, until the owner names the number.

9. **Words for the figures.**
   What: the count reads "9 of 18 orders arrived". Money owed reads "$33.17 still in the mail".
   Gain: plain words for what the money is: paid for, not yet in hand.
   Loss: "owed" from the brief is not on screen.
   Pick: "still in the mail".

10. **Undo after Mark arrived.**
    What: the answer line says "Marked arrived" with the seller, cards and cost, and offers Undo.
    In the Adding machine, Undo is also a key.
    Gain: a wrong press costs one tap, with no confirm dialog.
    Loss: Undo covers the last mark only. An older mark is fixed from the order (Mark still out).
    Pick: yes.

11. **Biggest text size (AX5) on the folded pose.**
    What: Desk spread stacks the summary and the segments and lets the list scroll; Check in docks
    full width below the list, so it covers no row. Adding machine hides the roll behind a "Roll" button, keeps one answer line, moves
    Undo into the answer line, and puts Mark arrived across the full last row. Keys are 60 pt tall.
    Both concepts shorten the answer to one line at AX5 ("3 orders match", "No match", the
    seller's name), and the Desk spread's sheet hides its title.
    Gain: every key and Mark arrived stay on the screen at AX5, with no scroll. Checked in
    headless Chrome in the Loaded, Typing, No match and Just marked states, both concepts, with the
    Desk spread's sheet open.
    Loss: at AX5 the Adding machine shows the roll only on request, and the key reason text
    ("Key an order number first") moves to the answer line. The Desk spread's summary fills the
    first AX5 screen, so the first order shows only after one scroll.
    Pick: yes.

12. **States.**
    What: Reading (spinner and words), Read failed (a sentence, Try again, and a closed "What the
    app said"), No orders (one sentence, Import orders), No match (one sentence, Clear the number),
    Just marked (answer with Undo). A failed read never shows as empty or zero.
    Gain: each state differs, and each has a control that leads on.
    Loss: none known.
    Pick: yes.

13. **Haptics.**
    What: a light haptic on each key, and a success haptic on Mark arrived. Not drawable in HTML.
    Gain: the keys feel like keys when the eyes are on the top page.
    Loss: none known.
    Pick: yes. The builder adds them.

14. **Colour.**
    What: a cool grey surface, white raised surfaces, one ink-blue accent for the main action, green
    for arrived and red for may be lost. A full dark set.
    Gain: colour carries state only; the main action is the one strong colour.
    Loss: my own values, not the repo's tokens, by the blind brief.
    Pick: yes, for this mockup only.

## Today and New

The brief says the tool shows a list of orders, a count, money owed and an input area. Those
parts carry a dashed "Today:" label. The pose layouts, the roll, the answer line, the packing slip
and the Check in button carry "New:". A blind designer cannot see the current screen, so a "Today"
label means only that the brief names the part.
