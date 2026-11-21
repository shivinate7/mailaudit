# Quiet alerts, blind designer 1: notes

Designer kind: blind. Mockup: `quiet-alerts-blind-1.html` in this folder. Every figure, name and
date in it is a sample.

Job, from the brief: "Tell me what I would regret not knowing, and nothing else." Three kinds of
alert (likely lost mail, a sync that did not agree, an overdue order), each with a reason, a time
and the thing it is about. The person picks what they hear about and when.

Deep links: `#d=folded|open|phone`, `t=auto|light|dark`, `s=loaded|calm|unknown|silent|failed|empty`,
`ax=5` (folded only), `hide=quiet-line|rehearsal`, `q=alerts|detail|rules`, `r=week|sheet|timing`,
`sel=<alert id>`, `note=<day index>`. Example: `#d=folded&t=dark&s=loaded&r=sheet&sel=f1`.

## Sources

- Device list: `python3 ~/.claude/lint/layout.py devices <repo root>` printed `unknown`. Sizes come
  from the brief: Duo folded 466 x 678 pt, Duo open 951 x 669 pt with the hinge from x 455.5 to
  495.5. Nothing sits across the hinge: each pose page is its own screen.
- Apple pages, each read 2026-11-21 through the `tutorials/data/...json` path, each answered 200:
  layout, typography, accessibility, buttons, sheets, lists-and-tables, tab-bars, toolbars (all
  under `https://developer.apple.com/design/human-interface-guidelines/`).
  - Typography: Dynamic Type sizes at Large (default) and AX5 are typed from its tables.
  - Accessibility: 44 x 44 pt minimum control size.
  - Tab bars: a tab bar floats at the bottom and is for navigation; badges only for critical news.
  - Sheets: Close on the leading edge; medium and large detents; grabber.
  - Layout: the page read gave no device sizes, so the large phone has none (item 15).

## Items

1. **Concept "Quiet line".** An alert list cut by a dashed line. Above it: what spoke, right away
   or in the morning note. Below it, folded shut: what was kept quiet, each with its reason. Tab
   bar: Alerts, Rules. Gain: the familiar list shape, and nothing hidden is lost, since the kept-quiet
   rows are one tap away. Loss: settings live on a second tab, so the person sets rules without
   seeing what they will cost. Pick: keep as the safe option. Hide control: "Hide" on its header.
   Focus id: `concept-quiet-line`.
2. **Concept "Rehearsal week" (the bold one).** No settings list. The first screen is ten days on a
   24-hour clock: three days heard, then a "Now" rule, then seven days ahead. Each alert is a mark at
   its hour. A ladder at the bottom ranks the kinds by regret; a quiet line sits between rungs. Tap a
   rung and next week redraws, and the headline counts interruptions. Gain: the person sees the cost
   of a setting before it bites; history and settings are one screen. Loss: no common app works this
   way, so it must teach itself; the clock band is dense at 466 pt. Pick: this one, if the owner
   accepts the learning cost. Hide control: "Hide" on its header. Focus id: `concept-rehearsal`.
3. **Kind by shape and colour.** Each kind has one glyph in one colour: envelope (lost), arrows
   (sync), clock (overdue), dashed ring (small delay), hatched "?" (not sure). Its name shows once
   per screen. Gain: passes ux-label-once; rows stay short. Loss: a new person learns four glyphs.
   Pick: keep. `label_once.py` on the rendered pages printed nothing.
4. **Tune from the alert.** Quiet line: "Worth hearing?" with "Yes" and "Tell me less" on each
   alert. Rehearsal: "Wait for the note for ..." or "Interrupt me for ..." in the mark's sheet. The
   answer shows beside the press, with Undo. Gain: the person tunes at the moment of annoyance. Loss:
   a press there changes a rule for all alerts of that kind. Pick: keep. Owner grant: yes.
5. **Three fates.** Quiet line: per kind, "Right away", "8:00 note" or "Never". Rehearsal: above the
   line interrupts; below it waits for the note or stays quiet (one switch for all). Gain: one word
   per fate, the same in both concepts. Loss: Rehearsal cannot set two kinds below the line to
   different fates. Pick: keep both as drawn; the owner culls with the concept.
6. **Sample defaults.** Lost after 14 days from shipping; overdue after 3 days late; sync only if
   still wrong after 1 hour; small delays (under the overdue line) kept quiet. Gain: a first-run set
   that speaks only for loss. Loss: the numbers are guesses; a blind designer has no data. Pick: the
   owner sets real ones. Owner grant: yes.
7. **Quiet hours, with lost mail allowed through.** 21:00 to 7:00. An alert inside quiet hours is
   held until they end, except likely lost mail, which may break through (switch, on). Rehearsal
   shows Thu 26 6:30 lost mail breaking through; turn the switch off and it moves to 7:00. Gain:
   nights stay quiet without hiding the one thing worth waking for. Loss: one more switch. Pick:
   keep, default on. Owner grant: yes.
8. **One morning note at 8:00.** Everything below the line goes into one note a day. Gain: one
   interruption a day at most for the rest. Loss: an overdue order learned at 8:05 waits a day.
   Pick: keep; the time is a stepper in 30-minute steps.
9. **Kept quiet stays findable.** Quiet line: "1 kept quiet" opens the rows below the line, each
   with its reason ("1 day late, under your 3-day line") and "Tell me about these". Rehearsal: a
   hollow dot on the clock. Gain: trust; silence never hides data. Loss: a little clutter. Pick: keep.
10. **States.** "Alerts to show", "All is well" (one sentence, nothing else, per ux-all-is-well),
    "Not sure" (sync last heard Tue 17: a hatched badge and "Check now"), "Everything silenced" (a
    warning that lost mail is silenced too, and one fix), "Read failed" (a sentence and "Try again";
    never drawn as empty or calm), "No orders yet" (a sentence and "Add your orders"; the ladder and
    filters hide). Gain: no state passes for another. Pick: keep.
11. **Navigation.** Quiet line: two tabs, Alerts and Rules, each tab name is its page title.
    Rehearsal: one screen; the moon button opens Timing in a sheet; a mark opens its sheet at the
    medium detent. Gain: Rehearsal has no place to get lost. Loss: Timing hides behind an icon. Pick:
    keep; the icon has a label for VoiceOver.
12. **Open pose.** Quiet line: the list on the left page, the alert on the right (list beside
    detail); Rules puts the kinds left and Timing right. Rehearsal: the week fills the left page;
    the right page holds the ladder with one line on why each rung matters, the picked mark, and
    Timing, so no sheet is needed. Each pose is its own layout.
13. **Largest text (AX5, folded).** Rows stack the badge, text and time. Segmented controls turn
    into a vertical list. Rehearsal swaps the hour bands for a list by day and moves the ladder into
    the scroll, since a pinned ladder would leave no room for the week. Tab bar labels keep their
    size, as iOS does.
14. **Frame numbers no Apple page gave.** These numbers are this designer's own: status band 44 pt,
    home band 20 pt, home indicator 134 x 5 pt, tab bar 56 pt high, device corner 28 pt and screen
    corner 18 pt, sheet corner 16 pt, a 3-hour gap between marks on the clock (a 44 pt target is
    about 3 hours of a 370 pt band).
15. **Large phone size.** No size is written for it in the device list or the pages read. It is
    drawn at a stand-in size, the brief's only portrait size, 466 x 678 pt, and its frame resizes
    by dragging the corner. The caption on the page says "stand-in". The layout is the folded one.
    Owner input needed: the phone's size.
16. **Badge on the Alerts tab.** Only for likely lost mail heard right away (the tab-bars page
    keeps badges for critical news). Gain: the badge keeps its meaning. Pick: keep.
17. **Colour.** Roles only: surface, raised, text, text-2, line, accent, and one colour per kind
    (lost, sync, late, minor), each in a light and a dark set. A cool grey-blue ground; a deep blue
    accent for "speaks"; a red only for lost mail. Gain: red means one thing. Pick: keep. Contrast
    of text-2, lost and late on raised was picked to clear 4.5:1; unmeasured with a tool.
18. **Haptics.** The steppers, the segmented controls, a rung tap and the switch each give a light
    selection haptic on change (ux-haptics-feel-substantial). Not drawable; recorded here.
19. **Consequence lines.** Under each kind in Rules: "Last 30 days: would have spoken 2 times."
    Rehearsal's headline counts the next 7 days. Gain: each setting shows its cost. Loss: the app
    must replay its rules over past and expected orders; that is new behaviour. Pick: keep. Owner
    grant: yes.
20. **No "Today:" labels.** A blind designer does not see the current screen, so it cannot know
    what exists. Each concept carries one dashed "New: the whole screen" tag instead.
