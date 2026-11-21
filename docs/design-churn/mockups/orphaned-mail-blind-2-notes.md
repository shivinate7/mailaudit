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
495.5 left empty), Duo folded at AX5, and the large phone at a stand-in size.

## Choices

Each item gives its options, the gain and loss of each, and my pick. The two concepts are the
only options drawn side by side; each has a Hide control in the review bar, so one press removes
it. The other items are drawn in my pick only; an owner who wants another option names it.

1. **Which concept.**
   - Shelf: first screen is a list of kept envelopes. Move by push: list, then envelope, then a
     sheet for one order. Open pose: list on the left page, the envelope on the right. Gain: a
     calm, familiar list; the best guess is ranked first. Loss: the orders that were ruled out
     sit behind a disclosure.
   - Line-up (bold): first screen is one envelope and every open order on one board. Move
     sideways through a pile of envelope stamps at the top; clues come from one field at the
     bottom. Each clue rules orders out in place. Open pose: envelope and clues on the left page,
     the board on the right. Gain: the person sees each clue work. Loss: a long board when there
     are many open orders.
   - Pick: show both; the owner culls with Hide.

2. **When the envelope is saved.**
   - At the first press (the shutter, or "Keep without a photo"). The sheet then says "Kept. It
     stays here until you match it." Gain: "do not lose it" is met in one press. Loss: kept
     envelopes with no clues can pile up.
   - After the clues, on Done. Gain: fewer bare entries. Loss: closing the sheet early loses it.
   - Pick: at the first press.

3. **Who decides the match.**
   - The person, on the order sheet ("It's from <sender>"). Undo replaces that button at once,
     and stays on the list ("Matched today") or as a line on the board. Gain: a wrong guess by
     the tool costs nothing. Loss: one more press.
   - The tool, when one order is left. Gain: no press. Loss: a wrong clue files mail wrongly.
   - Pick: the person.

4. **What happens to ruled-out orders.**
   - Stay visible with the reason (Shelf: a "Ruled out (n)" disclosure; Line-up: flat dashed
     tiles in their slot, reason at full text contrast, a "Hide ruled out" control). Each still
     opens and can still be matched. Gain: a wrong clue never hides the true sender. Loss: a
     longer screen.
   - Removed from view. Gain: a short screen. Loss: the true sender can vanish silently.
   - Pick: stay visible.

5. **How a clue is undone.**
   - A switch (Shelf) or a toggle chip (Line-up), plus remove. When nothing fits, the screen
     names the clue that rules out the most and offers "Turn off <clue>". Gain: a misread card
     is a one-press fix; "no match" is never a dead end. Loss: one control per clue.
   - Remove only. Gain: fewer controls. Loss: the person retypes a clue to test it again.
   - Pick: switch or chip.

6. **A typed card name that no open order has.**
   - Keep it, switched off, with "In no open order, so it starts off". Gain: a typo cannot rule
     out the real sender. Loss: the person must switch it on to use it.
   - Keep it, switched on. Gain: literal. Loss: it rules out every order at once.
   - Refuse it. Gain: clean data. Loss: loses what the person read on the card.
   - Pick: keep it, switched off. Typing suggests card names from open orders, with the count.

7. **A city on the label.** Owner grant: yes (it names a data gap).
   - A note on the envelope with "A note only. Orders carry no city.", and no switch. Gain: the
     screen claims only what it can do. Loss: a clue the person has goes unused.
   - A filter. Needs a sender city on each order, which the brief says orders do not carry.
   - Pick: a note. If orders gain a sender city, it becomes a clue.

8. **A partial name on the label.**
   - A clue: "rtley" matches any sender name holding it. Gain: partial labels help. Loss: a short
     fragment matches many; the sample has two orders from one sender, and the cards decide.
   - A note only. Gain: no false rule-outs from a misread label. Loss: a strong clue unused.
   - Pick: a clue, which can be switched off.

9. **The day rule.**
   - One-way: an order placed on or after the day the envelope came is ruled out ("Ordered
     after it came"). Each fitting order shows "Ordered N days before". Gain: a slow post never
     rules out the true sender. Loss: old orders stay in.
   - A window (e.g. 2 to 21 days). Gain: fewer orders fit. Loss: the brief gives no transit
     time, so any window is a guess.
   - Pick: one-way.

10. **Order of the candidates.**
    - Shelf ranks by matched clues (name 3, each card 2, day 1). Gain: best guess first. Loss:
      the weights are my guess.
    - Line-up keeps order-day order and never reorders. Gain: every tile stays where the eye
      left it. Loss: the fitting order can sit low on the board. So when three or fewer fit, the
      count line names each one as a "Check <sender>" button.
    - Pick: as drawn, one per concept.

11. **States.** Loading shows "Reading open orders… The envelope is already kept." and
    placeholder rows. Failed shows "Open orders didn't load, so nothing is ruled in or out yet.
    The envelope is kept." with "Try again". Neither shows zero, empty or "no match". Empty
    shows one sentence and "Add an envelope". One option only; it follows the house rule.

12. **Thumb zone.**
    - Pinned at the bottom: Shelf's "Add an envelope"; Line-up's clue field, suggestions above
      it. Gain: in reach with one hand. Loss: less room for content.
    - In the top bar. Gain: more content. Loss: out of thumb reach.
    - Pick: pinned at the bottom.

13. **AX5 (largest text).**
    - The Shelf list and each sheet scroll as one, so the button follows the content; rows stack;
      the board is one column; the clue field's placeholder shortens to "Add a clue". Gain:
      content stays readable. Loss: the Shelf add button is no longer pinned in thumb reach.
    - Keep the button pinned. Gain: in reach. Loss: at AX5 it takes about a quarter of the screen.
    - Pick: scroll as one.

14. **No app tab bar is drawn.** The brief names only this screen. If the app has a tab bar, it
    sits under these screens, and the pinned bottom controls sit above it.

15. **Palette and type.** Colours are mine, by role, with a light and a dark set; the house file
    gives no colour. Accent is a franking blue; "kept" is a green. System font; sizes from the
    Dynamic Type text styles at the default size. Spacing on the 4 px step, radius 8. The
    envelope photo is a drawn illustration with its own colours, dimmed in dark mode.

## Devices and sizes

- Duo folded 466 x 678 and open 951 x 669, hinge x 455.5 to 495.5: from the brief.
  `layout.py devices` printed "unknown" for this repo.
- Large phone: a stand-in size. No size is written in the brief or the device list, so it is
  drawn at the brief's folded size, 466 x 678. Its status bar and island are placeholders, not
  Apple values. The frame caption says so.
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

## Critique (impeccable, own pass before hand-off)

Degraded: single context. The coordinator allowed no sub-agents, so the design review ran here.
The detector ran on the file and found nothing (exit 0). It reads static markup only, and the
screens are drawn by script, so that clean result covers little. No browser overlay was
injected.

Findings and what was done:

- Line-up: the one fitting order sat below the fold among ruled-out tiles. Fixed: when three or
  fewer fit, the count line names each as a "Check <sender>" button.
- Shelf list: the best-fit line was grey footnote, the weakest text on the row. Fixed: it is
  accent and semibold.
- Line-up chips: the remove mark was a 12 px glyph beside the toggle. Fixed: 14 px; its hit area
  was already 44 pt.
- Large phone was not marked as a stand-in. Fixed: caption and notes say so.
- Open: the Line-up board grows with every open order. "Hide ruled out" answers it, but it is
  off by default. Left for the owner (question below).

Questions for the owner (from the critique):

- Line-up with many open orders: should "Hide ruled out" start on once clues exist?
- Should the tool ever propose a match on its own when one order is left, or stay silent?
- Is a photo worth its press, or should "Keep without a photo" be the first button?
