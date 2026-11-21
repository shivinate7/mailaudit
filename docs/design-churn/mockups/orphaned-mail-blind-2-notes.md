# orphaned-mail-blind-2 notes

Designer kind: blind. Designer: orphaned-mail-blind-2. Mockup: `orphaned-mail-blind-2.html`.
Drawn from the brief's job only. I did not see today's screen, its code, its spec or its tokens,
so no part is labelled "Today:". Each part this design adds carries a dashed "New:" label (the
Labels control turns them off).

The job, in the person's words: "I have an envelope, I do not know whose it is, and I do not want
to lose it." Two needs follow, in this order: keep it safe now, find the sender later.

## Deep links

Open the file from disk and add a hash. `c` is the concept, `s` the state, `t` the theme.

- Concepts: `#c=shelf`, `#c=lineup`.
- States: `s=loaded`, `s=detail` (envelope open), `s=compare` (order open), `s=capture`
  (add an envelope), `s=loading`, `s=failed`, `s=nomatch`, `s=matched`, `s=empty`.
- Theme: `t=light`, `t=dark`; no `t` follows the system.
- Hide a concept: `hide=shelf` or `hide=lineup`. Labels off: `labels=off`.
- Example: `orphaned-mail-blind-2.html#c=lineup&s=nomatch&t=dark`.
- Focus for the waiting page: `#opt-shelf` with `#c=shelf`, `#opt-lineup` with `#c=lineup`
  (the folded Duo frame of the concept on show).

Each link draws four frames: Duo folded (466 x 678), Duo open (951 x 669, hinge gap x 455.5 to
495.5 left empty), Duo folded at AX5, and the large phone.

## Choices

1. **Two concepts, each with its own structure, movement and first screen.**
   - Shelf: first screen is a list of kept envelopes. Move by push: list, then envelope, then a
     sheet for one order. Open pose: list on the left page, the envelope on the right.
   - Line-up (bold): first screen is one envelope and every open order on one board. Move
     sideways through a pile of envelope stamps at the top; clues are added from one field at
     the bottom. Each clue rules orders out in place. Open pose: envelope and clues on the left
     page, the board on the right.
   - Gain: the owner compares a calm list-first tool with a game-like elimination tool.
   - Loss: two concepts to judge. Pick: show both; hide either with its Hide control.

2. **Keep first, clues after.** The first press in "Add an envelope" (the shutter, or "Keep
   without a photo") saves the envelope at once. The sheet then says "Kept. It stays here until
   you match it." Every clue is optional.
   - Gain: the "do not lose it" need is met in one press, before any typing.
   - Loss: a kept envelope with no clues can pile up. Pick: keep first.

3. **Nothing matches until the person says so.** The tool ranks or rules out; only "It's from
   <sender>" on the order sheet matches. Undo shows in place of that button at once (answer at
   the press), and again on the list ("Matched today") or as a line on the board.
   - Gain: a wrong guess by the tool costs nothing. Loss: one more press. Pick: confirm by hand.

4. **Ruled-out orders stay visible, with the reason.** Shelf: a "Ruled out (n)" disclosure, each
   row with its reason. Line-up: struck tiles stay in their slot, flat and dashed, with the reason
   at full text contrast. A "Hide ruled out" control collapses them without moving the rest.
   - Gain: a wrong clue never hides the true sender silently. Each ruled-out order still opens
     and can still be matched. Loss: a long board. Pick: show by default.

5. **Clues switch off, they are not just deleted.** Each clue has a switch (Shelf) or is a
   toggle chip (Line-up). When no order fits, the screen names the clue that rules out the most
   and offers one control, "Turn off <clue>".
   - Gain: a misread card name is a one-press fix, and "no match" is never a dead end.
   - Loss: switches add a control per clue. Pick: switches.

6. **Card names come from the open orders.** Typing suggests card names that exist in open
   orders, with how many orders hold each. A typed name in no open order is kept but starts
   switched off, with the line "In no open order, so it starts off".
   - Gain: a typo cannot rule out the real sender. Loss: the person must switch it on to use it.
   - Pick: starts off.

7. **A city is a note, not a filter.** The brief says orders carry a day, a sender and cards,
   not a city. So a city on the label is kept on the envelope and says "A note only. Orders
   carry no city." It has no switch (a control that changes nothing is absent).
   - Gain: the screen claims only what it can do. Loss: a clue the person has goes unused.
   - Pick: note only. If orders gain a sender city later, it becomes a clue. Owner grant: yes
     (it names a data gap).

8. **A partial name on the label is a real clue.** "rtley" matches any sender name holding it.
   The sample has two orders from one sender, so the name alone leaves two and the cards decide.
   - Gain: partial labels help. Loss: a short fragment matches many. Pick: use it.

9. **The day rule is one-way.** An order placed on or after the day the envelope came is ruled
   out ("Ordered after it came"). There is no upper bound on transit time, because the brief
   gives none. Each fitting order shows "Ordered N days before".
   - Gain: no true sender is ruled out by a slow post. Loss: old orders stay in. Pick: one-way.

10. **Shelf ranks; Line-up does not.** Shelf orders fitting senders by matched clues (name 3,
    each card 2, day 1). Line-up keeps every tile in order-day order and never reorders it.
    - Gain: Shelf puts the best guess first; Line-up keeps every tile where the eye left it.
    - Loss: the weights in Shelf are my guess. Pick: as drawn.

11. **States differ.** Loading shows "Reading open orders… The envelope is already kept." and
    placeholder rows. Failed shows "Open orders didn't load, so nothing is ruled in or out yet.
    The envelope is kept." with "Try again". Neither shows zero, empty or "no match". Empty
    shows one sentence and "Add an envelope".

12. **Thumb zone.** Shelf's main action, "Add an envelope", is pinned at the bottom. Line-up's
    main input, the clue field, is pinned at the bottom; its suggestions open above it.

13. **AX5 (largest text).** At AX5, rows stack, the board is one column, the clue field's
    placeholder shortens to "Add a clue", and a sheet or the Shelf list scrolls as one so its
    button follows the content. Gain: content stays readable. Loss: at AX5 the Shelf add button
    is no longer pinned in reach of the thumb. Pick: as drawn.

14. **No app tab bar is drawn.** The brief names only this screen. If the app has a tab bar, it
    sits under these screens, and the pinned bottom controls sit above it.

15. **Palette and type.** Colours are mine, by role, with a light and a dark set; the house file
    gives no colour. Accent is a franking blue; "kept" is a green. The system font, sizes from
    the Dynamic Type text styles at the default size. Spacing on the 4 px step, radius 8. The
    envelope photo is a drawn illustration with its own colours, dimmed in dark mode.

## Devices and sizes

- Duo folded 466 x 678 and open 951 x 669, hinge x 455.5 to 495.5: from the brief.
  `layout.py devices` printed "unknown" for this repo.
- Large phone: no size is written in the brief or the device list. It is drawn at the brief's
  folded size, 466 x 678. Its status bar and island are placeholders, not Apple values.
- Status bar (28) and home indicator (20) heights on the Duo are placeholders, not Apple values.
  The frames pad with `env(safe-area-inset-*)` plus these placeholders.
- The switch is drawn 48 x 28 inside a 44 pt hit area; no page I read gives a switch size.

## Apple pages read (2026-11-21, each answered 200)

From `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`:

- layout: respect safe areas; lay out by size class. Its device size table was not in the text I
  read, so no device size comes from it.
- typography: Dynamic Type sizes. Default (Large): Large Title 34/41, Title 2 22/28, Title 3
  20/25, Headline 17/22, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1
  12/16. AX5: Large Title 60/70, Title 2 56/66, Title 3 55/65, Headline and Body 53/62, Callout
  51/60, Subhead 49/58, Footnote 44/52, Caption 1 43/51. I took the AX5 row as the twelfth iOS
  table on the page, by its position; the table names were not in the extracted text.
- accessibility: default control 44 x 44 pt, minimum 28 x 28; default text 17 pt, minimum 11.
- buttons: hit region at least 44 x 44 pt.
- sheets: Cancel (or Close) dismisses without saving; Done pairs with Cancel or Back.
- tab-bars, toolbars, lists-and-tables: read; no number used.
