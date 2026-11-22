# Overdue mail: blind designer notes

Designer kind: blind. Designer: lost-mail-warning-blind-1. Mockup: `lost-mail-warning-blind-1.html`.

This designer saw no current screen, spec, token file or other mockup. Every part is drawn as
new. A "Today:" label is not used, because this designer cannot know what exists today.

## How to open it

- Concepts: `#c=clock`, `#c=calendar`, `#c=track`.
- States: add `&s=empty`, `&s=loading`, `&s=failed`, `&s=unknown` or `&s=notice`. No `s` is the
  loaded state.
- Theme: add `&t=dark` or `&t=light`. With no `t`, the page follows `prefers-color-scheme`.
- A package: add `&sel=tdr` (or any sample id) to open with that package chosen.
- Focus ids for the page writer: `concept-clock`, `concept-calendar`, `concept-track`. Each
  holds that concept's four frames.
- Each concept tab has a hide button. One press removes one concept.

## Devices and sizes

- Duo folded, 466 x 678 pt, and Duo open, 951 x 669 pt with the hinge at x 455.5 to 495.5:
  from the brief. `layout.py devices` printed `unknown` for this repo, so no written size
  exists there.
- Large phone: no size is written in the brief, in `layout.py devices` or on the Apple
  pages read. It is drawn at the brief's folded size, 466 x 678, in a frame the reviewer can
  drag to resize. Owner to give the size.
- AX5: a fourth frame draws the folded Duo at the largest accessibility text size.
- The drawn status bar (44 pt) and home indicator area (20 pt) are this designer's choice. No
  Apple page read gives them. The frames also pad with `env(safe-area-inset-*)`.
- A check confirms nothing crosses the hinge in any open frame.

## Apple pages read, 2026-11-21

Each answered 200 through `developer.apple.com/tutorials/data/.../<page>.json`.

- layout: lay out by size class; respect safe areas. It gave no device size table.
- typography: Dynamic Type tables. Default (Large) and AX5 sizes come from it.
- accessibility: 44 x 44 pt default control size; 4.5:1 contrast for text up to 17 pt.
- buttons, sheets, tab-bars, lists-and-tables, toolbars: control use, sheet Done on the trailing
  edge, tab bar is for navigation not actions.

## Design choices

1. **Three concepts, one data model.** Claim clock (a ranked list), Claim calendar (an agenda
   by closing day) and Day-30 track (chips on a ruler). Gain: three real structures to cull.
   Loss: more to review. Pick: show all three; the owner culls.

2. **Claim clock: rank by days left, two bands.** "Claim within 5 days" over "Past day 14".
   Gain: the next package to act on is always the top row; no sort control needed. Loss: the
   money is split by band, not by seller. Pick: yes.

3. **Day-30 track (bold): no list as the first screen.** Each package is a chip at its day on a
   ruler from day 14 (top) to the day-30 cliff (bottom, nearest the thumb). Gain: the clock
   itself is the screen; the urgent end sits in the thumb zone; money reads as position, not as
   a column. Loss: unfamiliar; a crowded day cannot hold every chip. A day with no free lane
   hides the extra chips and shows "N more: show the list". The List button in the top bar
   is always there. Pick: show it as the bold option.

4. **Look ahead stepper (track only).** Steps 0 to 14 days ahead. Chips slide toward the cliff,
   packages under day 14 enter (blue edge), and the money readout updates. Gain: shows what
   waiting costs, in the person's own terms. Loss: one more control. Pick: yes. A haptic on
   each step is advised (house rule `ux-haptics-feel-substantial`); a mockup cannot draw it.

5. **Claim calendar: agenda by the day each window closes.** A day strip jumps the agenda;
   unfolded, a month grid shows the money that closes each day. Gain: answers "what must I do
   this week" and plans claims. Loss: two packages with the same money on far-apart days look
   alike in the list. Pick: yes.

6. **Thresholds.** Nudge from day 14. Urgent from day 25 (5 days left). Day 31 on is "Past the
   window". Gain: matches the brief's day 14 and "near 30". Loss: day 25 is this designer's
   reading of "near 30". Pick: day 25. Owner grant: yes (the urgent day is a ruling).

7. **Window closed stays visible, folded away.** A package past day 30 sits in a closed group
   (clock, calendar) or a tray under the cliff (track). Gain: the person learns about day 31
   instead of the package vanishing. Loss: money that may not come back still shows. Pick:
   show it, collapsed, last.

8. **Money summary at the top.** Clock: the money to claim within 5 days, then the money past
   day 14. Calendar: money waiting, then the part that closes within 5 days. Track: the money
   inside the last 5 days. Gain: the brief's "how much money is stuck" is the first thing read.
   Loss: red money is loud. Pick: yes; red only for the within-5-days figure.

9. **One detail, used by all three concepts.** Days left, a 30-day bar, order date, tracking,
   a cards-arrived stepper and the money still owed, then "Mark claim filed" and "All cards
   arrived". Each answer appears in place of its button, with Undo. Gain: one home, one set of
   names. Loss: the track popover hides the bar and stepper to stay small. Pick: yes.

10. **Partial arrivals scale the money.** Stepping cards arrived lowers the money still owed in
    proportion. Gain: the money stays true as cards come in. Loss: assumes each missing card is
    worth the same. Pick: yes, as a sample rule. Owner grant: yes (the money rule).

11. **Claim filed is a state, not a delete.** A filed package leaves the open list (the next row
    takes its slot) and shows under "Claim filed" (clock), or as a hollow chip with "filed"
    (track). Gain: the person can see what is in progress. Loss: none found. Pick: yes.

12. **The app does not file the claim.** No button opens the seller or the order: this designer
    cannot confirm the app can. Gain: no false promise (`ux-statements-are-true`). Loss: the
    person leaves the app to file. Pick: draw none. Owner grant: yes, if a link to the order
    page should be added.

13. **Telling, not hunting: a notification.** State `notice` draws a banner: "Tiny Dragon TCG
    closes tomorrow. Claim $6.12 today. 3 more packages close within 5 days." A press opens
    that package. Suggested rule: one notification on the day a package reaches day 14
    (batched per day), one at day 25, one on day 29. Gain: answers "I'd rather be told than
    find out on day 31". Loss: notifications need permission and a schedule. Pick: yes. Owner
    grant: yes (adds notifications).

14. **Tracked packages are left out, and the screen says so.** A footnote gives the count.
    Gain: the person knows why a package is missing here. Loss: one line. Pick: yes.

15. **States.** Loading keeps the loaded size. A failed read says the overdue list is unknown,
    with Try again and a closed "What the app said". Unknown age (no order date) gets its own
    group or tray, never counted as zero. All clear says "All is well." with Check again.

16. **No tab bar drawn.** This screen's place among the app's sections is unknown to a blind
    designer. The clock uses a segmented control for open and filed, not a tab bar. Gain: no
    invented sections. Loss: the frame shows no app navigation. Pick: none drawn.

17. **AX5.** Rows stack, marks become inline pills, the track turns into the list, and the
    track's readout and stepper scroll with it. Gain: nothing clips. Loss: the first screen at
    AX5 is mostly the money summary. Pick: yes.

18. **Colour.** Role names only; values are this designer's choice. Cool grey surfaces, an ink
    text colour, a blue tint for actions, amber for past day 14, red for within 5 days.
    Light and dark sets. Text sizes are in pt (drawn as px), from Apple's tables.

## Not decided here

- The large phone's size (see Devices).
- How the person files a claim outside the app (item 12).
