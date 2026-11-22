# Weekly recap, blind designer 2: notes

Designer kind: blind. Mockup: `weekly-recap-blind-2.html`. The job: "Tell me how my week went in ten seconds."
Every figure, seller and date in the mockup is sample data. Today in the sample is Saturday 21 Nov 2026.

Deep links: `#c=summary|tide|exceptions`, `s=loaded|allwell|unknown|quiet|loading|failed|empty`,
`t=light|dark` (no `t` follows the system), `d=folded|open|ax5|phone`, `h=<concept>,...` hides concepts.
Example: `#c=tide&s=unknown&t=dark&d=open`. The focus id of each concept is `pick-summary`, `pick-tide`
or `pick-exceptions`; it lands on the first frame shown.

Each option has a Hide button in the Concept bar, so one press removes one option.

## Concepts

1. **Plain summary.** One sentence answers the week ("41 cards came, 12 more than the week before.
   2 packages are late."). Three rows below it (Came, Still out, Late) each give cards and money and open
   their packages. Folded: tap pushes a list. Open: the list sits on the right page. Week paging in a
   bottom toolbar, in thumb reach.
   Gain: the ten-second answer is a sentence; the patterns are plain iOS. Loss: the least distinctive;
   the sentence and the rows repeat some figures. Pick: keep as the safe choice.
2. **Tide line (the bold one).** The week is one picture. A line runs across seven day columns. Each
   package that came is a filled block above the line, on its day. Each package still out hangs below the
   line on its due day; a late one is hatched, one with no due date is dashed. A dashed outline shows the
   week before. Tap a day: a sheet (folded) or the right page (open). Swipe the picture, or use the
   pager, to change week. At the largest text size the picture turns into one row per day.
   Gain: the week reads at a glance, by shape. Late stands out with no reading. No common order-tracking
   app uses this. Loss: exact counts need a tap or VoiceOver. A first look needs the key line at the
   bottom. Pick: my pick for the ten-second job.
3. **Exceptions first.** The screen is a list of weeks. The open week names only what is not normal
   ("2 packages are late", "3 packages have no due date"), or says "All is well.", then shows four
   numbers in tiles. Tap another week to open it. Open pose: the weeks on the left, the open week and
   its late packages on the right.
   Gain: follows the house rule that a status summary names only what is not normal. Older weeks are
   one tap away. Loss: a normal week shows little until you read the tiles. Pick: keep as the second choice.

## Choices inside the concepts

4. **Late, not "overdue".** The brief says overdue. The screens say "Late": shorter and plainer.
   Gain: one short word fits a row and a column. Loss: if the app already says "overdue", two words
   name one thing. Pick: Late, unless the app already uses overdue. Owner grant: yes.
5. **What counts as late.** A package is late when its due date is before today and it has not come.
   A package with no due date is shown apart, as unknown, and never as on time or as late.
   Gain: the unknown is never shown as zero. Loss: needs a due date in the data; I do not know if the
   orders carry one. Owner grant: yes.
6. **Week start.** Weeks run Monday to Sunday. Gain: the weekend stays in one week. Loss: may not match
   the person's habit. Owner grant: yes.
7. **What "not normal" means** (Exceptions first, and the Plain summary sentence): late packages and
   packages with no due date. Fewer cards than the week before is not treated as a problem.
   Owner grant: yes.
8. **Still out includes late.** "Still out" counts every package not yet here, late ones included; Late
   is a part of it. So Still out matches the brief's "cards still out", and Came plus Still out covers
   every order. Pick: as drawn.
9. **Money.** Each figure gives cards and money together ("41 cards, $63.20"), so there is no separate
   money row. Money still out is the cost of the cards not yet here. Pick: as drawn.
10. **A past week.** For an older week, Still out and Late are as they stood at the end of that week.
    The oldest week says "No earlier week to compare" and never shows 0. Pick: as drawn.
11. **Status by shape and colour.** Filled square: came. Outline: still out. Hatched: late. Dashed: no
    due date. The same four shapes in every concept. Forced-colours mode keeps the shapes.
12. **States.** Loading keeps the space with grey blocks. A failed read says so, has Try again, and hides
    the machine text in a closed "What the reader said". No orders at all: one sentence and one control,
    "Import orders". A week with no cards says so and still shows what is out.
13. **"Import orders" is a guess.** I do not know the app's import step or its name. The button only
    says that it opens the import screen. Owner grant: yes.
14. **Where the recap lives.** Not drawn: a blind designer does not know the app's sections. It could be
    its own tab or a screen opened from one. Owner grant: yes.

## Devices and type

15. **Duo sizes** come from the brief: folded 466 x 678, open 951 x 669, hinge gap from x 455.5 to 495.5.
    The two pages are 455.5 wide and the hinge is 40, off the 4 px step; the brief sets them.
    `layout.py devices` printed `unknown` for this repo.
16. **Large phone: a stand-in size.** No size is written for it. The frame starts at the folded Duo size
    (466 x 678) and can be resized. Owner grant: yes (give a size).
17. **Type** uses the iOS text styles at the default size and at AX5, the largest accessibility size,
    from Apple's typography page. Sizes are in points, drawn as px.
18. **Safe areas.** The frames draw the safe area only. Status bar and home indicator are outside it.

Apple pages read 2026-11-21 (each answered 200): layout, typography, accessibility, buttons, tab-bars,
toolbars, sheets, charts (developer.apple.com/design/human-interface-guidelines/<page>).

## Checks run

- `check_ios_mockup.py`: exit 0.
- `label_once.py` on each frame of every concept and state: no hits.
- Contrast: every text colour on every surface is 4.5:1 or more in both themes.
- A headless driver pressed every kind of control in every concept, state and frame: each press changed
  the screen. No element crosses the hinge. The swipe changes the week.
