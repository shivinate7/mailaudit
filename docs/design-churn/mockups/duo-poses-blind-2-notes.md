# duo-poses-blind-2: notes

Designer kind: blind. Mockup: `docs/design/duo-poses-blind-2.html`. It opens from disk, with no server
and no network.

The brief gives the job, the users and the data shapes: a list of orders, a count, money owed and an
input area. I read no current screen, spec, token file or other mockup. All sample data is invented.

## What is drawn

Each concept has five frames, in this order:

1. Duo folded, 466 x 678 pt.
2. Duo open as a book, 951 x 669 pt, with the hinge from x 455.5 to x 495.5.
3. Duo open tall, propped like a laptop, 669 x 951 pt, with the hinge from y 455.5 to y 495.5.
4. Large phone, resizable.
5. Duo folded at the largest text size (AX5).

Every frame works in light and in dark. Each frame shows five states: loaded, loading, failed, no
orders, and a search that matches nothing.

Deep links (join with `&`):

- `#t=light`, `#t=dark`
- `#s=loading`, `#s=error`, `#s=empty`, `#s=nomatch`
- `#p=folded`, `#p=book`, `#p=tall`, `#p=phone`, `#p=ax5`
- `#c=ledger` or `#c=calculator` shows one concept only
- `#swap=1` puts the calculator keys on the left page in the book pose
- `#tabbar=square` turns the capsule tab bar off (item 10)
- `#echo=0` hides the echo line (item 5)
- `#axkeys=scale` lets the calculator keys grow at the largest text size (item 9)

Focus ids. To pick a concept, use `ledger` or `calculator`. Each frame has its own id, in the form
`<concept>-<pose>`, such as `calculator-book`. These are the focus ids for each option:

- Item 4: `calculator-book`, linked with and without `&swap=1`.
- Item 5: `calculator-tall`.
- Item 9: `calculator-ax5`.
- Item 10: `ledger-folded`.

## Sources

I read these Apple pages on 2026-11-21, through their `tutorials/data` JSON. Each one answered 200.

- layout: respect the safe areas, and lay out by size class. The page no longer has a table of device
  sizes, so it gives no size for the large phone.
- typography: the iOS Dynamic Type tables. Large (default) gives Large Title 34/41, Title 3 20/25,
  Body 17/22, Subhead 15/20, Footnote 13/18 and Caption 2 11/13. AX5 gives Large Title 60/70,
  Body 53/62 and so on. The mockup uses these values exactly, with 1 CSS px = 1 pt.
- accessibility and buttons: a control is 44x44 pt by default, and a button's hit region is 44x44 pt
  at least.
- tab-bars: a tab bar floats above the content at the bottom of the screen. It is for navigation, not
  for actions.
- lists-and-tables and toolbars: read. I used no number from them.

## Choices

1. **Ledger concept** (hide it with the "Ledger" chip, or link `#c=calculator`). This is a list of
   orders with a detail page and a floating tab bar with Orders and Sellers. Folded, it is a navigation
   stack. In the book pose, the list is on the left page and the order is on the right page. In the
   tall pose, the list is the answer on the upper page. The search field, the filter, Mark arrived and
   the keys are on the lower page.
   Gain: anyone who has used a phone already knows it, and each pose uses its own space well.
   Loss: folded, it is a phone app, which is the thing the person complained about.
   Pick: keep it as the safe option.
2. **Desk calculator concept, the bold one** (hide it with the "Desk calculator" chip, or link
   `#c=ledger`). There is no list screen, no tabs and no back button. A display shows the count and
   the money owed. A tape below it rolls the matching orders. A key pad does every act: Open, Arrived
   and All change the view, the digits narrow the tape by order number, the arrows step the cursor,
   and Mark arrived and Undo act on the line. The tall pose is the person's laptop exactly: display
   and tape on the upper page, keys on the lower page.
   Gain: a fast check-in when the mail comes. You type a few digits and press Mark arrived, and the
   cursor steps to the next line. The same structure is right in every pose.
   Loss: it cannot search by seller. Folded, the tape shows only about three lines above the keys. It
   uses its own key pad, not the system keyboard.
   Pick: this one, for the job as written.
3. **The tall pose is drawn as the open pose turned.** The brief sets the open pose at 951 x 669 with
   the pages side by side. The job asks for one page above the other. I turned the brief's open pose to
   669 x 951, with the hinge from y 455.5 to y 495.5. This is not a new size. I read "carried tall like
   a book spread on its side" as the same arrangement, held in the hand. The side-by-side pose is drawn
   as the book pose.
   Gain: it answers "it's a laptop on my desk". Loss: if a third posture was meant, it is not drawn.
   Pick: draw both. See Input Needed.
4. **Calculator keys on the left or right page in the book pose** (the "Calculator keys on the left
   page" chip, `#swap=1`). The default puts the answer on the left page and the keys on the right page.
   Gain: one hand reaches the keys while the other holds the device. Loss: none, but one of the two
   placements must be picked. Pick: the default, with the swap offered as a setting.
5. **An echo line sits on the keys page.** When the keys are a hinge away from the answer, a line of
   fixed height above the keys shows the typed value and a one-line result: the selected order, the
   number of matches, or "Marked arrived: …". The full answer stays on the upper page. The rule
   `ux-answer-at-press` asks for an answer where the press was.
   The "Echo line beside the keys" chip hides it, or link `#echo=0`.
   Gain: the person does not look across the hinge after each press. Loss: the answer is said twice.
   Pick: keep it.
6. **A marked row holds its place until the next act, and Undo replaces a confirm.** Mark arrived
   flips the row in place, shows a line such as "Marked arrived: Kestrel Cards" with Undo
   beside it, and moves nothing. In the calculator, the cursor steps to the next line. The row leaves
   the Open view at the next key press.
   Gain: nothing jumps under the thumb, and the person sees the result. Loss: the Open view briefly
   holds one arrived row. Pick: keep it. No other version is drawn.
7. **"Owed" is the total cost of the orders not yet arrived.** The brief does not define money owed.
   Gain: the figure goes down as the mail comes in. Loss: if "owed" means a refund or a balance due,
   this figure is wrong. Pick: this reading, until the owner says otherwise.
8. **The calculator has no tab bar.** Owner grant: yes. This departs from the house default in the
   house tokens, Font and navigation: on a phone, navigation uses a bottom tab bar. The Open, Arrived
   and All keys do the job of tabs.
   Gain: every control is on one pad, in thumb reach. Loss: it departs from the house rule and the
   common iOS pattern. Pick: the departure, but only in this concept.
9. **Largest text (AX5).** In the Ledger, the whole page scrolls, and the search field and the tab bar
   stay pinned. The tab bar labels keep their default size. In the calculator, the display and the
   tape grow and scroll together. The key pad and its echo line keep their default sizes, as the
   system keyboard does.
   Gain: the keys still fit on the folded screen. Loss: the key labels do not grow. Apple's
   accessibility page says to let text grow to at least 200 percent. Owner grant: yes, because the keys
   do not follow that line. The chip "Calculator keys keep their size at largest text" turns it off,
   or link `#axkeys=scale`. Then the keys grow and the pad scrolls. Pick: keep the keys fixed.
10. **The tab bar is a capsule.** Owner grant: yes. This departs from the house radius of 8 px. Every
    other corner is 8 px. The "Capsule tab bar" chip turns it off, or link `#tabbar=square`.
    Gain: it matches the floating tab bar on the tab-bars page. Loss: one shape breaks the house radius.
    Pick: the capsule.
11. **Search.** In the Ledger, the search finds a seller name or part of an order number. The
    calculator finds part of an order number only, because a key pad has no letters. Gain: the
    calculator keeps one pad. Loss: you cannot find a seller there by name. Pick: keep it. No other
    version is drawn.
12. **Status bar and home indicator heights are unknown.** No page I read gives them. The frames use
    `env(safe-area-inset-*)`, with placeholders of 44 px and 20 px from the house space tokens. These
    are not Apple numbers.
13. **The phone frame has no written size.** `layout.py devices` answers "unknown" for this repo. The
    brief and the Apple pages give no size either. The frame opens at 466 x 678, which is the brief's
    only portrait size, and you can drag its corner to resize it. It is marked
    `data-device="phone-large"`.
14. **Every label is "New:", and there are no "Departs from:" lines.** A blind designer cannot see
    today's screen. So each concept carries one dashed "New: whole screen" label, and no choice cites
    the existing app.
15. **States.** Loading and failed show the count and the money owed as "—" or "?", never as 0. Failed
    shows Try again. No orders shows one sentence and Add orders. A search that matches nothing keeps
    the filters and shows Clear. An empty Open view says "Every order has arrived. All is well."
16. **Critique pass** (impeccable critique, with a single context and no sub-agent tool). I fixed
    these: the striped hinge is now plain. A pressed view key no longer outshines Mark arrived. Forced
    colours keep the selected row, the pressed key and the edge of each key. The mockup's own controls
    have a 4 px inset. The echo messages are short enough to fit. One finding is left on purpose: the
    detector flags line heights of 1.29x, but those are Apple's Dynamic Type leading values (Body
    17/22).
17. **Colour and type.** I picked my own colour roles: slate text, an ink-teal accent and an amber for
    owed money, each with a light set and a dark set. The type is the system font at the Dynamic Type
    sizes, with tabular figures for every number. Spacing is on the 4 px step.

## Input Needed

- Item 3: are there only two open postures, side by side and one above the other? Or is "carried tall
  like a book on its side" a third posture?
- Item 7: what does "money owed" mean?
- Items 8, 9 and 10 are marked `Owner grant: yes`.
- From the critique: does the mail show the order number? If it does not, a search by digits cannot
  find the order, and the calculator loses its main use.
- From the critique: should the folded Ledger mark an order from the list with a swipe? Today it takes
  two taps, and the calculator takes one press.
