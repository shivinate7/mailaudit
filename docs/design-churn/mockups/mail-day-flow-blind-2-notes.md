# Mail day flow: notes of blind designer 2

Designer kind: blind. Mockup: `mail-day-flow-blind-2.html`. Every figure on it is sample data.

The job: bring in the day's post, sort it into small piles, open each envelope, and finish when the
pile is empty and everything is accounted for. Odd mail goes aside for later. Leaving and coming
back never loses the place.

Two concepts. Each has its own structure, way to move and first screen. Each concept has a "Hide
this concept" control, so one press removes it.

## Deep links

Open the file from disk and add a hash. `s` sets the state of both concepts, `t` the theme, `c`
scrolls to one concept.

- States: `#s=count`, `#s=sort`, `#s=work`, `#s=envelope`, `#s=aside`, `#s=done`, `#s=loading`,
  `#s=failed`, `#s=empty`.
- Themes: `t=light`, `t=dark`. With no `t`, `prefers-color-scheme` sets it.
- Example: `mail-day-flow-blind-2.html#c=board&s=envelope&t=dark`.
- Focus ids for the page: `concept-pile` (Pile by pile) and `concept-board` (Letter board).

Each concept draws four frames: Duo folded (466 x 678), Duo open (951 x 669, hinge 455.5 to
495.5, nothing across it), large phone (440 x 956, assumed), and Duo folded at the AX5 text size.

## Choices

1. **Concept: Pile by pile.** A guided run in four steps: count in, sort, work pile by pile, done.
   First screen: "Mail day", step "Count in", a stepper. Movement: one main button per step, then a strip of four
   piles (A–E, F–L, M–R, S–Z) that are also buttons, and a tab bar with Mail day and Set aside.
   Gain: each next step is one obvious button; the strip shows how much is left in each pile.
   Loss: four steps before the first envelope; the fixed piles may not fit a day with mail under
   one letter only. Pick: keep, as the safe concept. Hide control: "Hide this concept".
2. **Concept: Letter board (the bold one).** The home screen is an alphabet. Letters with mail
   today are lit; each lit key shows one dot per envelope, which fills green (all here) or amber
   (set aside). The person sorts the post on the table by those letters, then taps the letter of
   the envelope in hand. A sheet lists the senders under that letter, then the envelope. No list
   screen, no tabs, no steps. Gain: the board is the pile map, the progress and the record at
   once; the keys sit in the thumb zone; the count is on the board from the first second. Loss:
   no app of this kind works this way, so it needs one line of help (shown until the first
   envelope); a day with many senders under one letter makes long sheets. Pick: this one, if the
   owner can take the departure in item 9. Hide control: "Hide this concept".
3. **Count in first, and "left in hand" as the one big number.** Both concepts ask how many
   envelopes came in, with the expected number beside it. "Left in hand" is in-hand minus opened
   minus set aside. Gain: the person always knows how much is left, against the real pile, not the
   order list. Loss: one more step at the start (Letter board puts it inline, Pile by pile on its
   own screen). Pick: keep in both. The count can change later: the board keeps − and + beside
   the number; opening more than counted raises the count.
4. **The envelope: "All here" by default, tap what is missing.** Each card row starts as here. A
   tap marks it missing (struck through, amber). The main button reads "All here", or "Set aside,
   1 card missing". Gain: the common case is one tap per envelope. Loss: a person who skims can
   press All here with a card missing. Pick: keep; the record stays open to change from Set aside.
5. **An envelope with no sender.** Pile by pile: a row under every pile list. Letter board: a "?"
   key with a dashed amber edge, then a sheet that confirms. Both set it aside and count it as
   accounted for. When every expected envelope is open but some are still in hand, Pile by pile
   asks to set them aside. Gain: odd mail never stops the run, and the count still reaches 0.
   Loss: Pile by pile sets aside at one tap (with Undo); Letter board costs a second tap. Pick:
   keep both forms, one per concept.
6. **Done is a moment.** When "left in hand" reaches 0 the screen turns into an envelope with an
   airmail edge: "Done for today", the count all here, what waits for later, and how many expected
   envelopes did not come. The airmail edge is the page's one bold mark and shows nowhere else.
   Gain: a clear end. Loss: none found. Pick: keep. In forced-colours mode it falls back to a
   dashed border.
7. **Set aside holds the odd mail.** One list for both kinds: missing cards (with the card names)
   and no sender. An empty Set aside says what fills it and offers "Set aside one with no sender".
   Gain: one place to look later. Loss: the two kinds need different later work, and one list
   mixes them. Pick: one list; the reason line tells them apart.
8. **Keeping the place.** Each concept saves its whole state (piles, opened envelopes, the open
   envelope, the open sheet) on every tap. "Leave and come back" shows a home screen, then reloads
   from storage and says "Back where you left off." Folding and unfolding keep the same state: all
   four frames of a concept draw from one state. Storage failures are caught; the mockup still
   works, but a real build needs storage the person cannot lose. Gain: the job's "never lose my
   place". Loss: none in the design; the cost is in the build. Pick: save on every tap.
9. **Letter board has no tab bar.** House token rule: on a phone, navigation uses a bottom tab bar.
   The board has no sections to switch: Set aside is a chip under the count. Gain: the whole
   screen stays the board, with the keys in thumb reach. Loss: breaks a house rule, and Set aside
   is a chip, not a tab. Pick: no tab bar. Owner grant: yes.
   Departs from: house tokens, "Font and navigation", bottom tab bar.
10. **Open pose: a page per job.** Pile by pile: left page is the pile, right page is the envelope
    in hand, or Set aside, or (before work starts) who goes on each pile. Letter board: left page is
    the board, right page is the letter, the envelope, or Set aside. Each pose is its own layout.
    The tab bar shows only folded and on the phone, because both pages are visible when open.
    Gain: the envelope in hand and the pile are both in view; nothing sits across the hinge. Loss:
    the open pose has no tab bar, so it differs from the folded pose. Pick: keep.
11. **Biggest text size.** At AX5 the whole screen scrolls, so the main button follows the list and
    never hides it. The pile strip goes to two columns. The board shows only lit letters, three to a
    row. Rows wrap their trailing text under the name. The tab bar stays at the bottom. Gain:
    nothing is clipped or hidden. Loss: more scrolling; the board loses the letters with no mail,
    so its alphabet shape is gone. Pick: keep.
12. **States beside loaded.** Loading shows a line and three skeleton rows. A failed read says
    nothing is counted yet, keeps the marks, and offers "Try again", with the reason behind "What
    went wrong". No mail expected says so and offers "Add orders". None of them shows 0 or done.
    Gain: a failed read never looks like an empty day. Loss: none found. Pick: keep.
13. **Colour and type.** Colour by role, light and dark sets, the designer's own values: cool grey
    paper, navy ink, airmail blue for the main action, green for all here, amber for set aside. Type
    is the system font with the iOS Dynamic Type styles at the default size and at AX5. Spacing on
    the 4 px step, corner radius 8 px, from house tokens. Three radii depart from 8 px on purpose,
    to draw native iOS shapes: the sheet's top corners (16 px) and the floating tab bar capsule
    (30 px, tabs 26 px). Gain: the mockup reads as iOS. Loss: off the house radius. Pick: keep;
    the build takes the system shapes.

## Sizes and sources

- Duo sizes come from the brief. `layout.py devices` printed `unknown` for this repo, and
  `layout.json` writes no size for any device.
- The large phone has no written size anywhere. It is drawn at 440 x 956 pt, the designer's
  assumption. The owner should give the real size (Input Needed).
- The status bar strip (44 px) and home indicator area (20 px) are mockup stand-ins for
  `env(safe-area-inset-*)`, which a desktop browser reads as 0. No Apple page read gives them.
- The big count number (72 pt, 120 pt at AX5) is the designer's own size, not a Dynamic Type style.

Apple pages read 2026-11-21, each answered 200, through the `tutorials/data` JSON:
layout (safe areas, size classes), typography (Dynamic Type tables, Large default and AX5),
accessibility (44 x 44 pt default control, 17 pt default text, 200 percent text), buttons
(44 x 44 pt hit region), sheets (Cancel or Close on the leading edge), tab-bars, toolbars,
lists-and-tables.

## Critique

Impeccable critique, run 2026-11-21, single context: the designer agent has no tool to start the
two isolated assessments. Design review first, then the detector. Browser evidence came from
headless Chrome screenshots of each concept, not the live overlay.

Findings and what was done:

1. P1, ux-one-plain-name: in Pile by pile the tab read "Mail day" while the screen title read
   "Pile F–L", "Count in" or "Sort". Fixed: the title is "Mail day" on every step; the step or
   pile is the heading under it.
2. P1, error prevention: the no-sender row in Pile by pile set an envelope aside at one tap with
   no way back. Fixed: the row answers "Set aside" in place and shows an Undo row under it.
   Letter board already asks first, in a sheet.
3. P1, error prevention: "All here" is the default, so a person who skims can pass a missing card.
   Not fixed: kept on purpose (choice 4). Each envelope can be reopened from its row, key or
   Set aside.
4. P2, the board's − and + sit beside the big count, where a stray tap changes the count. Not
   fixed: the count must stay easy to correct, and the change shows at once in the big number.
5. P2, biggest text size: the tab bar fell to the end of the scroll. Fixed: it stays at the
   bottom while the screen scrolls.
6. P3, help: the board's one line of help shows only until the first envelope. Not fixed: on the
   open pose the right page keeps a hint; on the folded pose the lit keys carry the meaning.
7. Detector: one advisory, "repeating-gradient stripes". Kept: it is the airmail edge, the one
   mark of the Done moment, drawn from the subject (choice 6). It has a forced-colours fallback.
8. No-script view: the page now says the screens need JavaScript, instead of showing empty frames.

Questions from the critique are in the report under Input Needed.
