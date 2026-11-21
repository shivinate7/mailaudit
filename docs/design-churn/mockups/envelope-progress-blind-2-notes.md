# Envelope progress, blind designer 2: notes

Designer kind: blind. Mockup: `envelope-progress-blind-2.html`. Every figure, sender and card name is
sample data. The job: hold one envelope, read off its cards one by one, and know when the envelope is
done without counting.

Two concepts, each with its own first screen, structure and way to move around. Each concept has a
Hide control on the page, so one press removes it.

Deep links: `#c=ledger&s=progress&v=env`, `#c=ledger&v=list`, `#c=board&s=progress&l=M`.
States: `s=fresh|progress|complete|short|extra|empty|error|loading`. Theme: `t=light|dark`
(no `t` follows the system). Devices: `d=folded|open|phone|ax`. Sheets: `sh=finish|envs|extra`.
Focus for the waiting page: `ledger-folded` and `board-folded`.

## Sizes

- Duo folded 466 x 678 pt and Duo open 951 x 669 pt, hinge x 455.5 to 495.5: from the brief.
  `layout.py devices` writes no size for any device.
- Large phone: neither the brief nor the device list writes a size, and the HIG layout page I read
  gave no size table. Drawn at the folded size, 466 x 678 pt. Owner: give the size to draw.
- Type: Dynamic Type sizes from the HIG typography page, Large (default) and AX5 (largest) tables.
  Body 17 pt by default, 53 pt at AX5.
- Controls: 44 x 44 pt minimum hit region (HIG accessibility and buttons pages).

Apple pages read 2026-11-21 (each answered 200): human-interface-guidelines/layout, typography,
accessibility, buttons, sheets, lists-and-tables, tab-bars, toolbars.

## Choices

1. **Concept: Ledger.** Launch screen is a list of envelopes, each with a ring and its state in words
   (7 of 12, Complete, Short by 2, Not started). One tap opens an envelope: a running count on top,
   every expected card in one fixed order, a name field at the bottom. Duo open: list on the left
   page, the envelope on the right.
   Gain: familiar; shows every envelope's state at once; typing is fast for a person who reads names.
   Loss: needs a keyboard, which covers half the folded screen; the list scrolls past the count.
   Pick: keep as the safe option.

2. **Concept: Letter board (the bold one).** Launch screen is the envelope in hand, not a list. Each
   first letter of the expected names is a pigeonhole tile. A tile holds one dot per copy: filled =
   still to find, hollow = found. Tap the letter, then the name in the tray at the bottom. An empty
   tile turns dashed with a check. When every tile is empty, the envelope is done. Envelopes switch
   from the sender name at the top (a sheet). Duo open: board on the left, names and a numbered
   "Found in this envelope" list on the right.
   Gain: two taps per card, no keyboard; the board's emptiness answers "am I done" without counting;
   the whole envelope fits one folded screen.
   Loss: a new pattern to learn; a 30-name envelope gives up to 26 tiles (drawn: 4 columns past 12
   letters, untested on a real list); two names that start alike sit in one tray.
   Pick: this one, for the job as written.

3. **The count says what is left, not what is done.** "5 to find" is the large line; "7 of 12 found"
   is the small one. It turns into "Envelope complete" (green) or "Short by 2" (red).
   Gain: the person reads the one number they care about. Loss: none seen. Pick: yes, both concepts.

4. **Complete is automatic; short is a choice.** The envelope turns complete when the last card is
   found. "Finish" with cards left opens a sheet that lists what is missing; "Mark short" confirms.
   A short envelope keeps its list, and "Reopen envelope" undoes it. A late card found in a short
   envelope still counts.
   Gain: no step for the happy path; short is never a slip. Loss: one more tap to mark short.
   Pick: yes.

5. **Rows hold still (Ledger).** A found row stays in place and turns muted with a check. A "Still
   to find" filter hides found rows instead of moving them.
   Gain: follows ux-order-holds-still. Loss: found rows take space until filtered. Pick: yes.

6. **Return finds the one match (Ledger).** Type "moss", press Return: if exactly one unfound name
   matches, it counts and the field clears.
   Gain: one hand, no tap on the list. Loss: two partial matches need a tap. Pick: yes.

7. **Take back one.** Ledger: a minus control on each row with a find. Letter board: "Undo" in the
   tray right after a find, and a take-back control on each line of the found list (Duo open).
   Gain: a mis-tap costs one tap. Loss: one more control per row. Pick: yes.

8. **A card not on the list.** Ledger: a name with no match offers "Add ... as an extra card".
   Letter board: "Card not on the list" opens a name field in the tray. An extra card shows as
   "1 extra" beside the count and never changes the count.
   Gain: the person is not stuck with a card in hand. Loss: none seen. Pick: yes.
   Owner grant: yes. It adds a record kind (an extra card) to the envelope's data.

9. **Next envelope names its target.** On complete, "Next envelope" shows the next sender and its
   card count under it. With none left, "Every envelope is checked." and a control to the list.
   Gain: no surprise, no dead end. Loss: none seen. Pick: yes.

10. **States.** Loading keeps the loaded size (skeleton rows and tiles). A failed load says so,
    keeps the marks, has "Try again", and hides the server's words in "What the server said". No
    envelopes: one sentence and "Add an order". None of these shows as zero or done.
    Owner grant: yes. "Add an order" assumes an add step exists; a blind designer cannot see it.

11. **Largest text (AX5).** Ledger rows stack name over count and drop the mark; list rings hide.
    Letter board goes to two tiles a row; the tray moves below the board and the page scrolls.
    Gain: nothing clips at 53 pt body. Loss: the folded Letter board no longer fits one screen.

12. **Colour by role, my own values.** A cool paper surface and an airmail blue accent; green for
    found, red for short, amber for extra. Light and dark sets. No repo or product colour.

13. **Dot meaning is fixed.** A filled dot always means a copy still to find, a hollow dot a copy
    found, on tiles and in the tray. Red dots mean a short envelope.

14. **No tab bar.** Each concept has one task area, so a tab bar would hold one tab. Ledger uses a
    navigation stack; Letter board uses a sheet to switch envelopes.
    Departs from: the house default of a bottom tab bar on a phone (tokens.md). Owner grant: yes,
    only if the app around this screen has more than one section.

15. **"New:" labels.** As a blind designer I see no current screen, so every part is labelled New.
    The Labels control hides them.

## Critique pass (impeccable critique, single context: no sub-agent tool)

Detector: 0 findings. Design review findings:

- Fixed: the Ledger count scrolled away under the list. It now sticks at the top (not at AX5, where
  it would fill the screen).
- Fixed: tile dots mixed found and unfound by card. To-find dots now come first.
- Fixed: the dot meaning was never said. The tray says it until a letter is picked.
- Fixed: "Next envelope" did not say where it goes, and had no way on when none was left.
- Open: Ledger "Finish" sits at the top, out of thumb reach. Kept: it is a rare act, and the find
  field, the main act, is at the bottom.
- Open: with the keyboard up on the folded Duo, Ledger shows the count and about two rows. The
  Letter board needs no keyboard; this is the main case for it.

## Not drawn

- Haptics: a light tap on each find and a stronger one on complete is proposed, not drawn.
- How envelopes and their expected lists get into the app.
