# Undo recent ticks: blind designer 1

Designer kind: blind. Designer: undo-recent-blind-1. Mockup: `undo-recent-blind-1.html` in this folder.

The job: a person mis-taps a card. They need to see their last several ticks, undo any one of them
in one tap, minutes later too, and never hit another control by mistake. Each tick shows its card,
its order, its time and its device. The undo control never sits under the bottom bar and never moves
when something opens.

I saw no current screen. The checklist and the tab bar in each frame are stand-ins, marked
"Today: … (stand-in, not seen)". Each part a concept adds is marked "New: …".

Deep links: `#c=sheet|tab|bench`, `s=loaded|many|empty|unknown`, `t=light|dark|system`,
`d=all|folded|open|phone|ax5`, `o=sheet|detail|pick` (opens the sheet, a tick's order, or an older
tick on the bench), `btn=word`, `hold=insert`, `edge=trail`. For example
`undo-recent-blind-1.html#c=bench&s=loaded&t=dark&d=open`.

Focus ids, one per concept, in the folded frame: `choice-sheet` (first Undo button in the sheet,
with `o=sheet`), `choice-tab` (the Recent list), `choice-bench` (the bench panel).

## Rules every concept keeps

These hold in all three concepts. Each is a design choice, so each is an item.

1. **An undo edits its own row. It never adds a row, and changes no text.** Undo turns the row
   dashed, strikes the card name, and puts a redo arrow in the same button box; a screen reader
   hears "You undid this". Each row line holds one line, and a row that a later row on the same
   card can switch off always holds that reason line, hidden when not in force. Gain: no row
   changes height, so nothing moves under the thumb, and a mis-tapped undo is fixed by a second tap
   in the same spot. A Playwright pass undid and redid every row in each concept, folded, open and
   at the largest text: no undo button moved. Loss: the log does not record the undo as its own
   event, and a sighted person reads the undone state from shape, not a word. Pick: edit in place.
2. **Undo and Redo share one fixed box.** The glyph button is 56 x 56 pt (64 on the bench panel).
   The word button is 96 x 48 pt. Gain: a press changes no size. Loss: none found. Pick: fixed box.
3. **A tick from another device waits behind a pill while a list is open.** A reserved 44 pt slot
   above each list holds the legend. When a tick arrives from another device, the slot shows
   "1 new tick from Laptop. Show" in the same space. Nothing below it moves until the person taps
   it. On the bench, a "1 newer" pill sits in the panel header, and its space is reserved too.
   Options in the mockup: "Hold behind a pill" or "Insert at once", each with a hide control.
   Gain: the strongest guard against "I hit a different control". Loss: one more tap to see a new
   remote tick. Pick: hold behind a pill. Try it with "Add a tick from Laptop".
   A tick the person makes on this device shows at once, since their thumb is on the checklist,
   not on the list.
4. **An undo that would undo a later change is off, and says why on screen.** If the same card
   changed again after this tick, on any device, the row shows "Changed again on Laptop 2 min ago,
   so this undo is off." and the button is drawn off. The reason is text, not a hover, because the
   devices are touch only. Gain: undo never reverts someone else's newer change by surprise. Loss:
   to fix it, the person undoes the newer row first. Pick: off with a reason.
5. **The undo glyph labels itself once.** Options in the mockup: "Arrow, label once" (an undo
   arrow on each row, and one legend above the list: "undoes that tick", "puts it back") or "Word
   on each row" ("Undo" or "Redo" in each button). Gain of the arrow: the house rule on a label
   shown once holds, and rows stay calm. Gain of the word: no legend to learn. Loss of the word:
   "Undo" shows once per row, which the label-once check flags. Pick: arrow, label once. Each
   button has an accessible name such as "Undo: ticked Verdant Wyrm".
6. **Rows say each fact in a sentence.** "Ticked 1 min ago on this Duo", "Order 7C19-A2, Harbor
   Cards". Gain: no status word repeats as a bare label; time and device read as one fact. Loss:
   longer lines. Pick: sentences.
7. **The window is two hours.** The empty state says "No ticks in the last two hours." Gain: covers
   "a few minutes later" with room to spare, and keeps the list short. Loss: an older mis-tap is
   not here. Pick: two hours. Owner grant: yes (it sets how far back undo reaches).
8. **A failed read of other devices is not empty.** State "Other devices failed to load": a note
   says ticks from the other devices did not load and only this device's ticks show, with "Try
   again". Gain: no false "nothing to undo". Pick: note plus retry.
9. **Undo on another device's tick is allowed.** A tick made on Laptop can be undone from the Duo.
   Gain: the mis-tap is fixed where the person is now. Loss: two people on two devices could undo
   each other; item 4 limits the harm. Pick: allowed. Owner grant: yes (cross-device undo is a
   product rule).

## Concepts

Each concept has its own structure, its own way to move around and its own first screen. Hide any
one with the x beside its name in the mockup.

10. **Recent sheet.** First screen: the checklist. A round Recent button with a count sits beside
    the floating tab bar, in thumb reach. It opens a sheet over the screen, with Done at the
    trailing edge of its top bar. The undo buttons sit in a trailing column, one per row, 98 pt
    apart. Open Duo: no button; the right page is the Recent list all the time, beside the
    checklist. Gain: familiar, one tap from anywhere on the checklist, and the list never shares a
    screen with tick targets on the folded Duo. Loss: two taps to an undo (open, undo) on the
    folded Duo. A press on the Recent button opens only a sheet, so a miss there is harmless.
11. **Recent tab.** First screen: a Recent tab in the tab bar, with a clock column, groups "In the
    last 10 minutes" and "Earlier", and a device filter ("All devices", "This Duo"). Tapping a row's
    text opens the tick's order: every card in it, with tick controls, and the hint "Wrong card?
    Tick the one you meant below." Open Duo: the list on the left page, the order on the right
    page, with the undo kept on the left page only. Gain: a home to come back to; the order view
    answers "which card did I mean". Loss: a tab for a rare task; tab bars are for sections, so
    this one earns its place only if the person checks it often.
12. **Fix bench (bold).** First screen: the checklist with a bench fixed under it, above the tab
    bar. The bench holds the last tick in a panel with a large undo, and swap chips: the other
    unticked cards of the same order. One tap on a chip unticks the wrong card and ticks the meant
    one. Older ticks stack above the panel in a short spool, newest nearest the thumb; tapping one
    brings it onto the bench. Open Duo: the checklist on the left page, the bench fills the right
    page. No common checklist app keeps an always-open undo log in the thumb zone, ordered upward,
    with swap. Gain: fixes the mis-tap itself, not only its half; nothing opens, so nothing can move
    the undo. Loss: on the folded Duo the checklist shows only two or three rows; the bench takes
    the rest. The newest spool receipt's undo sits one row above the panel's undo, in the same
    column; a 12 pt gap and the panel's border part them, and a miss is fixed by redo in place.
    Option in the mockup: undo on the leading edge (away from the checklist's tick column
    on the trailing edge) or on the trailing edge, each with a hide control. Pick: leading edge.

Pick among the concepts: Fix bench, for the job's own words ("I tapped the wrong card"). If the
checklist space on the folded Duo matters more, Recent sheet. Owner grant: yes (a new screen
structure either way).

## Sizes and type

13. **Large phone size is not written.** `layout.py devices` prints `unknown` for this repo, and the
    brief gives no size. The frame is a stand-in, 430 x 932, chosen by this designer and labelled
    so on the page. It is not a device figure. Owner grant: yes (name the size).
14. **Chrome heights are this designer's own.** Status bar 44 pt, floating tab bar 64 pt, home
    indicator area 20 pt. No Apple page I read gives these. Each sits on the 4 px step.
15. **Largest accessibility text.** Sizes from Apple's largest Dynamic Type table: Body and
    Headline 53 pt, Large Title 60 pt, Subhead 49 pt, Footnote 44 pt. At this size each row
    stacks, the undo becomes a full-width 72 pt target at the foot of its row, and tab labels hide
    behind their icons. On the bench the panel moves to the top of a scrolling bench, so the undo
    for the last tick stays first. Loss: on the bench, the checklist shows one row.
16. **Colours.** My own, by role (surface, text, accent, ok, warn), in a light and a dark set. No
    product colour is used.

## Apple pages read

Read 2026-11-21 through `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`;
each answered 200.

- layout: safe areas; lay out by size class. Its JSON held no device size table, so no device
  size comes from it.
- typography: the Dynamic Type tables (Large, the default, and the largest accessibility size).
- accessibility: 44 x 44 pt default control size, 17 pt default text.
- buttons: a 44 x 44 pt hit region.
- sheets: Done on the trailing edge of a sheet's top bar.
- tab-bars: a tab bar is for navigation, not actions. So the Recent button sits beside the tab
  bar, not in it.
- toolbars, lists-and-tables: list and bar placement.
- undo-and-redo: describe the operation to be undone; do not redefine shake. No concept uses
  shake.
