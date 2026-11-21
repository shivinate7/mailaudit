# Quiet alerts, blind designer 2: notes

Designer kind: blind. Mockup: `quiet-alerts-blind-2.html`. Every figure, name and date on it is
sample data. As a blind designer I saw no current screen, so every part is marked "New:". None is
marked "Today:".

Deep links: `#c=line`, `#c=sentences` and `#c=letter` show one concept each. `s=empty`, `s=loading`,
`s=failed` and `s=unknown` set the state. `t=light` or `t=dark` sets the theme. `l=0` hides the
"New:" marks. `p=folded`, `p=open`, `p=phone` or `p=ax5` rings one frame. The focus ids are
`focus-line`, `focus-sentences` and `focus-letter`, each on that concept's folded Duo frame.

## Concepts

1. **Quiet line (the bold one).** One screen with no tabs. This week's alerts sit in three bands:
   Right away, At the round-up and, below a heavy line, Kept quiet. The bands are the settings.
   Tap a kind chip to move that kind, or tap the bell on a quiet row to hear about that kind of thing
   next time. On the folded screen, the line sticks to the bottom edge until you reach it, and a tap
   on it jumps to the quiet band. Open, the hinge is the line: what reaches you is on the left, and
   what was kept quiet is on the right.
   Gain: the person sees what was held back, so they can trust the silence. A regret becomes a rule
   in one tap.
   Loss: it is a new pattern to learn, and the bell is an icon-only control. A hint sentence names
   it once.
   Pick: this one, because it answers "tell me what I would regret not knowing" head on.
2. **Sentences.** Two tabs. Alerts is a plain list by day, and each alert opens to the one sentence
   that caused it. Rules holds those sentences, with tinted words you can change. Open, the right
   page shows what the rules would have told you this week.
   Gain: the most familiar of the three, and each rule reads plainly. Loss: settings and alerts are
   two places, and the cost of silence is shown only on the open Duo.
   Pick: the safe fallback.
3. **Morning letter.** The tool speaks once a day, in a short letter. Page back by day. Only a
   kind set to Right away breaks the letter and reaches you at once. Open, the letter is on the left
   and its settings on the right, so each change shows at once.
   Gain: the strongest answer to "when". Loss: a lost parcel waits until morning unless its kind is
   set to Right away.

Each concept has a "Hide this concept" control, so one press removes one option.

## Design choices

4. Quiet line has no tab bar. The house default for phone navigation is a bottom tab bar
   (`tokens.md`). Gain: one surface, and the settings sit next to what they change. Loss: it breaks
   the house default. Pick: no tab bar, because the screen has one section.
   Owner grant: yes (departs from a house default).
5. Kind names show once per screen. Rows carry the kind's icon only, and the chip or the card
   header names it (`ux-label-once`). Gain: less repeated text. Loss: the person must learn three
   icons. Pick: icons on rows.
6. Moving a kind moves its rows. An act on a kind re-sorts that kind's rows into their new band.
   Other rows keep their order (`ux-order-holds-still`). Pick: move them.
7. The answer shows where you pressed. After a bell tap, a note takes the row's place and offers
   Undo or OK, and the row moves only on OK. In a sheet, a line under the picker says what changes
   from now on. Pick: a note in place.
8. States. Loading shows Stop. Failed keeps the last good list, says when it was taken, offers Try
   again, and hides the server text under "What the server said". Unknown says sync was not
   checked, never "fine". Empty says "All is well." with one sentence and Check now.
9. Colour is by role, with a light set and a dark set: one indigo accent and a muted quiet tone. It
   is my own choice, as `tokens.md` gives no colour value. Space uses the 4 px step, and the radius
   is 8 px.
10. Type is the system font. The letter body uses the system serif (`-apple-system-ui-serif`) as
    content type. Sizes come from the Apple Dynamic Type table: Large (default), and AX5 for the
    accessibility frame.
11. Open-pose sheets stay inside the page that opened them, so nothing crosses the hinge from
    x 455.5 to 495.5.

## Sizes and sources

- Duo folded is 466 by 678 pt and Duo open is 951 by 669 pt, both from the brief.
  `layout.py devices` printed `unknown` for this repo.
- Large phone: no size is written in the brief or the device list. 430 by 932 pt is a stand-in, and
  the frame says so. The layout is fluid.
- The status bar (28 pt) and home bar (20 pt) heights are stand-ins. No page I read gives them.
- Apple pages read 2026-11-21, each as `.json` under `developer.apple.com/tutorials/data/`. All
  answered 200: HIG layout, typography (the Dynamic Type tables for Large and AX5), accessibility
  (44 by 44 pt controls), buttons, sheets (Cancel leading, Done trailing), lists and tables, tab bars
  (floating, navigation only), toolbars, notifications and toggles. The layout page holds no device
  size table.
- Port rule: I cite no file or symbol for today's behaviour, because a blind designer reads no code.

## Critique (impeccable, design review only)

Method: design review only. The detector does not apply to a native-platform mockup. No
sub-agents were run, and no snapshot was written.

Scores: status 3, real world 3, control 3, consistency 3, error prevention 3, recognition 2,
flexibility 2, minimal design 3, error recovery 3, help 2. Total 27 of 40 (Acceptable, at the top
of the band).

Findings:
- P1: sheets let the list show through while they rose. Fixed: the rise animation now moves the
  sheet only and no longer fades it.
- P1: on the folded Quiet line, the quiet band sat below the fold. Fixed: the line sticks to the
  bottom and jumps to the band on tap.
- P2: the "New:" tag on the letter's top control was clipped. Fixed: that tag now sits below the
  control.
- P2: at AX5, kind chips overflowed. Fixed: chips wrap.
- P2: on the letter's settings page, room kept for each answer line leaves wide gaps. Not fixed. It
  stops a press from moving content, so it stays as drawn.
- P3: rows show times in two forms ("8:02 am" and "Yesterday, 6:00 pm"). Not fixed.
- P2: the bell on quiet rows is icon-only, and a hint sentence names it once. Owner choice below.

## Input needed

- Item 4: Quiet line drops the house bottom tab bar. Owner grant: yes.
- The large phone size: name the device, or keep the 430 by 932 pt stand-in.
- Critique question: keep the Quiet line's icon-only bell, or give it a text label on each row and
  accept a repeated label?
- Critique question: is a once-a-day letter (Morning letter) acceptable when a lost parcel's kind is
  not set to Right away?
