# Unsaved tick concepts: notes

Designer kind: blind. Designer: failed-checkin-blind-2. Mockup: `failed-checkin-blind-2.html`.

The job: a person ticks hundreds of cards fast. A tick that does not save must be seen at once,
named, and redone in one tap, with no loss of place or list. As a blind designer I saw no current
screen, so every part is marked "New:" and none "Today:".

Deep links: the hash takes `c` (outbox, envelope, tape), `d` (all, folded, ax, open, phone),
`s` (live, sending, failed, many, waiting, unknown, done, empty, loadfail), `n` (good, flaky,
none, error), `t` (auto, light, dark), `l=off` (hide the "New:" labels) and `h` (hidden concepts).
Each concept has a Hide control on the page.

## Choices

1. **A tick has a visible save state, per copy.** Each copy ordered is a pip: hollow (not in),
   dashed and turning (saving), filled (saved), red with "!" (did not save), amber with "?" (no
   answer), dotted grey (waiting for signal). Gain: "did it take" is answered on the row, by
   shape as well as colour. Loss: six pip states to learn. Pick: yes.
2. **The count shows saved copies only.** "17 of 38 cards in" and "2 of 4 in" never count a
   tick that has not saved. Gain: a wrong count cannot hide behind a tick that failed. Loss: the
   count lags the press by the save time. Pick: yes. Owner grant: yes (it changes what the
   received count means while a save is open).
3. **Redo sets one copy, it does not add one.** A tick names its copy ("copy 3 of 4"), so Redo
   after a lost answer cannot count a copy twice. Gain: Redo is always safe to press. Loss: the
   saved data must hold a per-copy tick, not only a total. Pick: yes. Owner grant: yes (data
   shape change; a builder and the spec must take it).
4. **Four kinds of not saved.** Refused (red, needs Redo), no answer (amber, Redo is safe),
   waiting for signal (grey, held on the phone and sent by itself when signal returns; Redo
   tries now), and saving. Gain: the person knows which need them. Loss: more states to build
   and test. Pick: yes.
5. **The answer shows at the press.** The row (or tile) that was tapped turns red and its tick
   button becomes Redo in the same place (house rule ux-answer-at-press). Gain: the thumb is
   already there. Loss: the next copy of that card waits until Redo (Outbox and Tape only).
   Pick: yes.
6. **A failure also shows in one place that never scrolls away.** Outbox: the tray above the tab
   bar. Envelope: the capsule at the top and a red mark on the package chip. Tape: the red ledge
   under the tape. Each says "All is well." when nothing is unsaved (ux-all-is-well), so its
   slot never appears or vanishes under the finger. Gain: a failure from three cards ago is
   still in view. Loss: one always-on strip of screen. Pick: yes.
7. **Concept: Outbox tray.** Checklist grouped by order, tray above a two-tab bar (Check-in, Tick
   log). Open pose: list left, tick log right. Gain: the most familiar shape; fast for a long
   list. Loss: the tray covers the last row (a spacer pads it). Pick: my first choice.
8. **Concept: Envelope pages.** One package per page, cards as large tiles; a package strip at the
   bottom is the way around. Open pose: package list left, one package right. Gain: matches one
   envelope in the hand; tiles are big targets. Loss: a card in another package needs a page
   change; more scrolling across packages. Pick: offer.
9. **Concept: Receipt tape (bold).** No tabs. The lower part is a printed tape, newest line by the
   thumb, stamped "Saved" when confirmed; a failed tick drops to a red ledge that stays put.
   Open pose: list left, full-height tape right. Gain: every press leaves a visible receipt, which
   answers "I never know if it took" head on. Loss: the list gets less height when folded; at the
   largest text size only the ledge stays. Pick: offer; strongest on the open Duo.
10. **A card stays in "Still coming" until the person leaves the list.** A card whose last copy
    saves dims but does not leave, so no row moves under the finger. Gain: no layout shift. Loss:
    done rows linger until the filter or page changes. Pick: yes.
11. **Largest text (AX5, body 53 pt).** Rows stack; the title and filter scroll with the list;
    the tray and ledge show only "1 not saved" and Redo; the tape lines hide. Gain: the failure and
    Redo stay on screen. Loss: the card name of a failure is one tap away (the sheet). Pick: yes.
12. **Haptics.** Not drawable. Proposed: a light tap on each tick, an error haptic only when a
    tick fails, no haptic on a save (hundreds a session would numb it). Pick: yes.
13. **Not drawn.** Undo of a mistaken tick, and lost-mail flags. Both are out of this brief.
14. **Machine text.** The server's words sit behind "What the server said" in the sheet and the
    load-failed state (ux-machine-text-hidden).

## Devices and sources

- Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge at x 455.5 to 495.5: from the
  brief. `layout.py devices` printed `unknown` for this repo.
- Large phone: no size is written in the brief, the device list or the Apple pages read. Drawn at
  440 x 956 pt as an assumption. Owner grant: yes (name the size, or accept it).
- Status bar (36 pt) and home indicator: drawn, not measured.
- Apple pages read 2026-11-21, each through its `tutorials/data/...json` form, each answered 200:
  layout, typography, accessibility, buttons, sheets, lists-and-tables, tab-bars, toolbars
  (developer.apple.com/design/human-interface-guidelines/). Used: Dynamic Type sizes at Large
  (default) and AX5 from typography; 44x44 pt targets from accessibility and buttons; Done on
  the trailing edge from sheets; a floating tab bar for navigation only from tab-bars. The layout
  page no longer lists device sizes, so the read gave no phone size.
