# Year close, blind designer 1: notes

Designer kind: blind. Drawn from the brief's job, facts and house rules. No current screen, spec,
tokens or mockups were read. The repo's own instruction file was loaded into context when the
session started, so the run is not fully blind. Mockup: `year-close-blind-1.html`. Every figure,
name and order on it is sample data. Each order carries a seller name. The brief does not name
sellers, so that field is my assumption.

The job, in the person's words: "Put the done stuff away, but never lose it." Facts used: an
order is fully received or still open, it has a year, and each year has a total spent.

## Deep links

Open the file from disk, then add a hash. Keys: `c` concept (`shelf`, `roll`, `sinks`), `s`
state (`default`, `confirm`, `closed`, `unknown`, `error`, `empty`), `t` theme (`light`,
`dark`), `d` device (`folded`, `open`, `phone`, `ax5`), `y` year shown, `tab=years`,
`stub=<year>` (unrolled roll), `f=noprice`, `hide=<concept,...>`, `marks=0`.

- `#c=shelf&s=default`, `#c=shelf&s=confirm`, `#c=shelf&s=closed&tab=years&y=2026`
- `#c=roll&s=default`, `#c=roll&s=confirm`, `#c=roll&s=closed&stub=2026`
- `#c=sinks&s=default`, `#c=sinks&s=unknown`, `#c=sinks&s=closed`
- Any of them with `&t=dark` or `&d=ax5`.

For a pick on the waiting page, each option has its own URL and focus. A concept shows only when
its `c=` is in the hash, so each focus needs its own URL:

- Year shelf: `year-close-blind-1.html#c=shelf`, focus `concept-shelf`
- Receipt roll: `year-close-blind-1.html#c=roll`, focus `concept-roll`
- Self-sorting: `year-close-blind-1.html#c=sinks`, focus `concept-sinks`

"Today:" marks show parts I inferred from the brief's facts (orders, received or still open). I
did not see them on a screen.

## Choices

1. **Three concepts, each with its own structure.**
   - Year shelf: a deliberate close. Orders and Years are two tabs. Done orders stay in Orders
     until the person puts the year away.
   - Receipt roll, the bold one: no list and no tabs. Each year is one printed roll. Past years
     hang above the present as stubs, and closing the year tears the roll off.
   - Self-sorting: no close act. An order leaves daily work when its last item arrives. A year
     locks itself once it has ended and nothing is still coming.
   Gain: three different answers to "is closing an act or a rule". Loss: three times the
   review. Pick: Year shelf. It answers the job's two halves in two places, and its close is one
   press with a clear "what moves, what stays". Self-sorting is the runner-up: it removes clutter
   all year, not only in January. Each concept has a Hide control in the concept picker.

2. **The close act is named "Put away"**, from the person's own words. It keeps that name on the
   button, the sheet title, the confirm button and the result. The Receipt roll calls its act
   "Tear off", the same way on every surface. Gain: one plain name per act. Loss: none seen.
   Pick: as drawn.

3. **Orders still open at the close stay in daily work.** Each one joins the closed year when
   its last item arrives. Options: (a) as drawn, (b) block the close until every order is in,
   (c) move open orders into the next year. Gain of (a): the close never waits on the mail, and
   the year's record ends complete. Loss: a closed year's total can still grow after the close.
   Pick: (a). Owner grant: yes (it sets what "closed" means).

4. **Which year an order belongs to.** Drawn by the date it was placed, not the date it
   arrived. An order placed Dec 28 and received Jan 5 counts in the old year. Gain: matches a
   purchase date, which a tax record most likely needs. Loss: a closed year can still gain
   items, see item 3. Pick: placed date. Owner grant: yes.

5. **A close can be undone, for the most recent closed year only.** "Take 2026 back out" in Year
   shelf, "Tape 2026 back on" in Receipt roll. Self-sorting has no undo: it locks by rule. Gain:
   no fear of the press. Loss: the record is not frozen, which may matter in a dispute. Pick:
   undo for the latest year only. Owner grant: yes.

6. **"Nothing is deleted" sits on the close sheet.** It answers "never lose it" at the moment of
   the press. A blind designer cannot know how the record is kept, so the line is a promise the
   build must make true (house guidance ux-statements-are-true, copy claims only what is true).
   Pick: keep the line if the build keeps every order. Owner grant: yes.

7. **A closed year is read only, with three tools:** the year's figures (spent, orders, items),
   a search by seller or order number for disputes, and Export (a CSV file for taxes). Export
   downloads a real sample file in the mockup and answers at the button with the file name.
   Gain: the two later uses in the job each have one control. Loss: no edit, so a missing price
   in a closed year stays missing until the year is taken back out. Pick: as drawn.

8. **States are different shapes, never zero or empty for unknown** (house rule
   ux-unknown-is-not-empty, unknown is not empty). Total unknown: "Spent: unknown, 3 have no
   price" with a control that shows only those orders. Failed load of past years: a red-edged
   block with "Try again", and the text says the orders are not changed. No orders yet: one
   sentence and one control. Gain: a gap or a failure never reads as zero spent or no years.
   Loss: three more states to build and test. Pick: as drawn.

9. **Main act in thumb reach** (house rule ux-thumb-zone). "Put away 2026" sits in a bar at the
   bottom of Orders, above the tab bar. "Tear off 2026" sits at the dashed cut line, which the
   roll opens on. The result of the press shows in the same place (house rule
   ux-answer-at-press). Gain: one hand reaches the close and sees its result. Loss: the bar
   takes about a fifth of the folded screen from the list. Pick: as drawn.

10. **Open pose: two pages, two jobs.** Year shelf: Orders left, Years right, and no tab bar,
    because both sections show. Receipt roll: past rolls left, this year's roll right. The past
    sits left of the present. Self-sorting: orders and years left, the picked year right.
    Nothing sits on the hinge, and the close sheet stays on the left page. Gain: daily work and
    the record show side by side, with no tab switch. Loss: the open pose is a second layout to
    build, not the folded one made wider. Pick: as drawn.

11. **Receipt roll has no tab bar.** The house tokens say phone navigation uses a bottom tab bar.
    The roll moves by scrolling through time instead: the past above, this year, the cut line,
    then the slips still coming. The roll opens scrolled to the bottom, on today's work. Slips
    scroll sideways, so only two and a half show at once. Gain: one picture of the whole record,
    and a close that feels final. Loss: a departure from the house rule, a sideways list, and a
    long scroll up to old years on the folded pose. Pick: keep it as the bold option.
    Owner grant: yes (departs from the house tab bar default).

12. **Receipt roll prints in a monospace face**, only on the paper. The app chrome stays on the
    system font. Gain: the roll reads as printed matter. Loss: denser lines. Pick: as drawn.

13. **Self-sorting marks an order arrived with one tap** on its row, so the reviewer can watch it
    sink into its year: the next row takes its slot and the year row flashes (house guidance
    ux-order-holds-still). The brief did not ask for a way to mark an order received. It is there only to show the
    concept. Pick: keep it for the demo only. Owner grant: yes (adds an act the brief did not
    name).

14. **Self-sorting locks a year by rule:** the year has ended and nothing from it is still
    coming. A year with a late order stays open into the next year. Gain: no ceremony. Loss: no
    clear moment to file taxes, and a year with one order that never arrives never locks. Pick:
    as drawn, and an order that never arrives needs its own way out (not drawn).

15. **Biggest text size (AX5).** Rows stack: name, then details, then the amount. The Year shelf
    bar drops its summary line at AX5 and keeps the button; the summary still shows in the list
    header and in the close sheet. Tab labels hide and icons grow. Loss: icon-only tabs at AX5.
    Pick: as drawn, and the build should give the tabs the system's large content viewer.

16. **Haptics** (house rule ux-haptics-feel-substantial). The Put away and Tear off confirms
    should play a success haptic. Not drawable in HTML. Gain: the close feels final in the hand.
    Loss: none seen, beyond one more thing to test on the device. Pick: success haptic on the
    confirm only.

17. **Year shelf keeps arrived orders in Orders all year.** The clutter the job names grows from
    January to December and clears only at the close. Option: fold the arrived list to one row
    ("212 arrived, show") during the year. Gain: less clutter every day. Loss: it moves Year shelf
    toward Self-sorting. Pick: not drawn; listed for the owner to cull or keep.

18. **The open roll shows its last 14 lines.** "Show 198 earlier lines" prints the whole roll in
    place. Gain: the first screen stays on today's work. Loss: one press to see the whole year.
    Pick: as drawn.

## Sizes, sources and gaps

- Duo sizes from the brief: folded 466 x 678 pt, open 951 x 669 pt, hinge x 455.5 to 495.5.
  `layout.py devices` printed `unknown` for this repo.
- Large phone: the brief gives no size, `layout.py devices` gives none, and the Apple pages read
  give none. Drawn at the brief's folded size and labelled so on the frame. On a screen under
  520 px wide, the phone frame fills the window.
- The status bar band (48 px) and home indicator band (20 px) are drawn guesses. No Apple page
  read gives these numbers. The CSS uses `env(safe-area-inset-*)` first.
- Type sizes: Apple Dynamic Type table, Large (default) and AX5 columns.
- Colour and spacing: house `tokens.md` (4 px step, 8 px radius, colours by role, light and dark
  sets). The hex values are this designer's own.
- The large title does not collapse to a standard title on scroll in the mockup.
- No loading state is drawn. Each read in the mockup is instant.

Apple pages read 2026-11-21, each answered 200:
- https://developer.apple.com/design/human-interface-guidelines/layout (safe areas, size classes)
- https://developer.apple.com/design/human-interface-guidelines/typography (Dynamic Type sizes)
- https://developer.apple.com/design/human-interface-guidelines/accessibility (44 x 44 pt targets)
- https://developer.apple.com/design/human-interface-guidelines/buttons (44 x 44 pt hit region)
- https://developer.apple.com/design/human-interface-guidelines/sheets (Cancel leading, confirm trailing)
- https://developer.apple.com/design/human-interface-guidelines/lists-and-tables
- https://developer.apple.com/design/human-interface-guidelines/tab-bars (navigation, floats at the bottom)
- https://developer.apple.com/design/human-interface-guidelines/toolbars (large title)
- https://developer.apple.com/documentation/xcode/device-hub (read for phone sizes: none found)
