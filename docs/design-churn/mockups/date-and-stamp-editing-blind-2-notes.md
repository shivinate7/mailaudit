# date-and-stamp-editing-blind-2: notes

Designer kind: blind. Mockup: `date-and-stamp-editing-blind-2.html` in this folder. Every name, date
and count on it is sample data.

The job: fix the day a package was marked received, look at a range of order dates, and fix a wrong
stamp. The person sees exactly what will change before it changes, and can undo it. Data shape used:
a package has one order date, zero or more received dates, and a stamp (Waiting, Received, Missing).
A range has a start and an end.

Deep links: add a hash to the file path. `#c=tray&s=<state>` or `#c=book&s=<state>`, plus `t=dark`
or `t=light`. `only=folded|open|phone|ax` draws one frame alone. The state names are in the link
row above each concept.

## Concepts

1. **Change tray** (`#c=tray`). First screen: the package list, with the order-date range as one
   button at the top. Move around: a tab bar (Packages, History) and a push to one package. Edits do
   not apply. Each one goes to a tray above the tab bar ("3 changes waiting"). Review lists every
   change as a sentence, with the old value struck and the new one underlined, and any change that
   follows from it ("And so it also removes the received date Fri 20 Nov"). Apply writes the set.
   Undo sits in the tray at once, and on each set in History.
   Gain: one plain pattern; many fixes go in one checked batch; History holds every applied set.
   Loss: two steps (edit, then apply) for a one-date fix; the tray takes space over the list.
   Pick: keep as the safe concept.
   Owner grant: yes, likely. A blind designer cannot read the spec; a draft-then-apply model
   probably departs from how edits work today.

2. **Day book** (`#c=book`), the bold concept. No package list and no edit form. First screen: a
   book of days, newest first. Each day lists what was ordered and what came in on that day. Move
   around: scroll through time. A desk sits under the book (in the thumb zone; the right page when
   the device is open). Tap a line to lift it. Tap the right day on the desk to lay it there. The
   book shows the old line struck in red pen ("Will move to Tue 17 Nov") and a dashed line on the
   new day ("Will be written here"). The desk lists the exact change. "Write correction" writes it.
   The correction is then written in the book on today's date, with Undo on that line, and the old
   spot keeps a struck trace ("Moved to Tue 17 Nov"). The range is set on the same desk with From and
   To. The person's own words ("I marked it on the wrong day") map one to one: find the day, lift the
   line, lay it on the right day.
   Gain: the fix happens where the mistake is seen; nothing is overwritten silently; the book is its
   own history. Loss: finding one package by name means scrolling by day; a new pattern to learn.
   Pick: draw it for the owner to judge against Change tray.
   Owner grant: yes. It replaces the first screen.

## Choices inside the concepts

3. **Knock-on changes are listed, never silent** (both). Removing the last received date sets the
   stamp to Waiting. Setting Waiting or Missing removes all received dates. Setting Received with no
   date adds today. Adding a date sets Received. Each preview names the knock-on line.
   Gain: no hidden change. Loss: these four rules are my own; they may not match the product.
   Pick: keep. Owner grant: yes, the rules need a ruling.
4. **Order date is read-only** (both). The brief names only received dates and stamps as wrong.
   Gain: one less thing to break. Loss: a wrong order date has no fix here. Pick: keep.
5. **Day limits** (both). A received date cannot fall before the order date or after today. Those
   days are off in the picker, and a line under it says why.
   Gain: an impossible date cannot be picked. Loss: a clock or order-date error blocks a true date.
   Pick: keep.
6. **More than one received date** (both). A package that came in parts keeps each date. Change
   tray: one row per date, each with change, remove and (once removed) "Put back" for that one date.
   Day book: "Move this date", "Add a second date", "Strike this date" on the desk.
   Gain: a split delivery is fixed one part at a time. Loss: more controls per package. Pick: keep.
7. **Undo, newest first** (both). "Undo", and "Redo" after it, is one name everywhere: the tray, each
   History set, each correction line in the book, and the Day book desk right after a write. Undo
   is on only while the package still holds what that fix wrote. An older fix under a newer one
   shows Undo off, with the reason in words ("A later change to Oxbow Trading sits on top of this
   one. Undo that one first."). Change tray also brings back thrown-away edits ("Bring back").
   Gain: an undo never wipes a later fix. Loss: undo is in order, not random access. Pick: keep.
8. **Range undo and empty, loading, failed reads** (both). A changed range shows "Back to <old
   range>". Empty range: one sentence and "Show all dates"; the range control stays. Loading shows
   dashed rows and words, never zero. A failed read (`s=readfail`) says nothing is lost and has
   Try again. Gain: no state reads as empty when it is not. Loss: none seen. Pick: keep.
9. **Apply or write fails** (both). The error shows at the button pressed, says nothing changed,
   keeps the edits, and has Try again. Each concept has a mockup-only switch to force it.
   Gain: no lost edit. Loss: none seen. Pick: keep.
10. **A pending fix is kept** (Day book). While a fix waits on the desk, a tap on another line does
    not drop it: the desk says "Write this fix or put it back before you lift another line."
    Gain: no silent loss. Loss: one extra tap to switch lines. Pick: keep.
11. **Answer at the press** (Day book). After "Write correction" the desk shows "Correction
    written", the exact change and Undo, until the next act. The same line is also in the book on
    today's date. Gain: the result shows where the thumb is, even when the book is scrolled. Loss:
    the range controls wait one tap ("Back to the dates"). Pick: keep.
12. **Largest text** (AX5, folded). The calendar becomes a list of days. Change tray rows stack.
    Day book: the desk takes the whole screen while a line is lifted, and shrinks to one button when
    idle; the range moves to one line at the top of the book. Sheet titles hide; the package name
    moves into the content. Gain: nothing clips at AX5. Loss: in Day book the book and the desk are
    not seen at once at AX5. Pick: keep.
13. **Thumb zone**. Apply, Write correction and the day strip sit low. Change tray's Apply is a full
    button at the sheet bottom, not top right as HIG places Done for sheets.
    Departs from: HIG sheets (Done on the trailing edge of the top toolbar). Gain: one-hand reach.
    Loss: Change tray's range button sits at the top of the list, out of thumb reach on the phone.
    Pick: keep; the range is set less often than a date is fixed.
14. **Colour roles**. Draft is violet with a dashed edge; removed is red and struck; added is green
    and underlined; the stamp uses shape too (filled check, ring, slashed ring), so no meaning rests
    on colour alone. Colours are my own picks; spacing is on the 4 px step; radius 8, except the
    floating tab bar, which is a pill as iOS draws it. Gain: draft, removed and added read apart in
    both themes and in forced colours. Loss: four accent colours. Pick: keep.
15. **Haptics** (`ux-haptics-feel-substantial`). A selection tick on each day pick (calendar, list
    or strip) and on each stamp choice; a success tap on Apply and on Write correction; a warning
    tap when an apply or write fails. A mockup cannot play them; the builder adds them.
    Gain: each change feels set. Loss: none seen. Pick: keep.
16. **No "Today:" labels.** A blind designer sees no current screen, so every part is marked "New:"
    (the toggle "Show New labels" hides them).

## Devices and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge at x 455.5 to 495.5: from the brief
  (`layout.py devices` printed `unknown` for this repo). No element crosses the hinge; a script
  checked every state.
- Large phone: 440 x 956 pt. No source gives this size; it is my pick.
- Status bar and home-bar heights (28/20 pt Duo, 54/34 pt phone) are my picks; the CSS also reads
  `env(safe-area-inset-*)`.
- Apple pages read 2026-11-21 (JSON under developer.apple.com/tutorials/data/): layout, typography
  (default and AX5 Dynamic Type sizes used here), accessibility, buttons, sheets, pickers, tab bars,
  toolbars, undo and redo. The layout page gave no device sizes.

## Checks

- `check_ios_mockup.py`: exit 0.
- `label_once.py` on every state and frame: the only hits are data (day names, package names) and
  sentence words ("to", "Received" inside "Changes the stamp from Received to Waiting").
- Impeccable detector: one finding (striped loading rows), fixed; now clean.
