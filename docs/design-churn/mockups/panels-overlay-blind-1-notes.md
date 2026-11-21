# panels-overlay-blind-1: notes

Designer kind: blind. The brief gave the job, the devices and the house rules only. I did not see
the current screen, its code, its spec or its tokens, so no item cites a file or symbol of the
product, and "Today:" labels are absent: I do not know what exists today. Every name, figure, date
and source on the page is sample data.

Open `panels-overlay-blind-1.html` from disk. Hash keys: `c` concept (`tray`, `spread`, `ring`),
`s` state (`list`, `sort`, `filter`, `dates`, `show`, `history`, `empty`, `histempty`), `t` theme
(`light`, `dark`; none follows the device), `h` hidden concepts, `p=1` shows the dashed "New:"
labels, `pw` and `ph` set the large phone's size. Focus ids for the waiting page: `focus-tray`,
`focus-spread`, `focus-ring`.

## Concepts

1. **Tray.** A bottom toolbar of four labelled buttons (Sort, Filter, Show, History). A button
   opens one tray of solid paper over the lower 60% of the list. The toolbar stays visible, and the
   tray rests on top of it. Close: tap the same button, tap the dimmed list, swipe the tray
   down, or the close button. Open Duo: no toolbar; the right page is the panel, with a four-way
   switch at its top, and the left page is the list alone.
   Gain: familiar, every panel one tap away, thumb reach. Loss: hides 60% of the list while open;
   a fixed tray height leaves blank paper under a short panel. Pick: yes, as the safe option.
2. **Spread.** The bottom line holds four chips that state the settings in words ("Newest first",
   "Open only, 2 sources", "Full rows", "3 changes"). A chip opens a card sized to its content that
   grows from the chip, with a tail. The list is not dimmed. Open Duo: the list reads across both
   pages like a book (the right page continues where the left page ends, and the two scroll
   together), and a card opens on the page you did not touch last, so the rows you are reading stay
   in view.
   Gain: most of the time nothing needs opening, because the state is readable; on the open Duo
   nothing you are reading is covered. Loss: the chip line scrolls sideways at 466 pt, so History
   can sit past the edge (a fade marks it); a chip's width changes when its words change, so the
   chips to its right slide sideways (they never move the list). Pick: yes, my first choice.
3. **Thumb ring (bold).** No toolbar. One round grip in the thumb corner. Hold it: a quarter ring of
   Sort, Filter, Show and History fans out; slide onto one, then left into its choices, and lift.
   Press, slide, lift opens, picks and closes in one gesture. A quick tap opens the same ring for
   tap-by-tap use, keyboard and VoiceOver. Sources, Dates and History open as a slip of paper above
   the grip. Open Duo: a grip on each outer corner, the ring stays on its own page, and the right
   page holds the change history, so the ring there has three choices.
   Gain: the whole list stays on screen until the press; the fastest path for a practiced hand.
   Loss: the hold is not discoverable; the grip covers part of a row (the list has 88 pt of extra
   space at its end); sliding across one choice to reach another needs a 140 ms dwell guard.
   Pick: keep as the bold option; test it by hand before building.

## Choices shared by all three

4. **The list never moves when a panel opens.** Each panel is absolute over the list region; the
   list keeps its size and scroll. Checked: opening each concept moved a row 0 px and kept the
   scroll offset. Gain: the brief's job. Loss: none found. Pick: yes.
5. **A change keeps your place.** After a sort, filter or show change, the row that was at the top
   of the view (or the row you last marked, if it is in view) stays at the same height on screen,
   and a 1.4 s outline marks it. Checked: after "Name, A to Z" the top row kept its offset. Gain: the
   person does not hunt for where they were. Loss: after a sort the rows around it are new. Pick: yes.
6. **Changes apply as you tap; no Done.** A panel closes with one gesture and never asks to save.
   Gain: one gesture to close, as the brief asks; Apple's sheets page pairs Done with Cancel, so
   having neither is consistent. Loss: no way to back out of a sort except picking the old one.
   Pick: yes.
7. **A tap outside closes and is swallowed** (Tray, Spread folded, Ring). The tap that closes does
   not also mark a row. Gain: no accidental marks. Loss: closing then marking takes two taps. Spread
   on the open Duo is the exception: the other page stays live. Pick: yes.
8. **Solid paper.** Panels are opaque paper with a firm edge and a shadow; Tray and Ring dim the
   list 16% (34% in dark); Spread does not dim. Gain: panel text never mixes with rows. Pick: yes.
9. **One home per setting.** "Show" holds row fields only (Source, Date, Amount, Compact rows);
   open or done lives in Filter alone. Pick: yes.
10. **History** lists marks only (done or open), newest first, each with Undo. Sort and filter
    changes are not logged. Gain: a short list. Loss: a lost filter cannot be undone from history.
    Pick: yes; the owner may want settings logged.
11. **Empty states.** A filter that empties the list keeps the filters visible and shows one
    sentence and Clear filters. Empty history shows one sentence and Back to the list.
12. **Largest text (AX5).** Tray opens full height; toolbar labels hide to icons (each keeps its
    accessible name); Spread cards go full width; the Ring falls back to one full-height page with
    all four sections, because ring labels cannot hold 53 pt text. Rows stack their figures under
    the name. Loss: the bold gesture does not exist at AX5.
13. **Keyboard and VoiceOver.** Escape closes; a keyboard press on a toolbar button or chip moves
    focus to the panel's title; closing returns focus to the button.

## Devices and sources

14. **Sizes.** Duo folded 466 x 678 pt and open 951 x 669 pt with the hinge gap at x 455.5 to 495.5
    are from the brief; `layout.py devices` writes no size for this repo. The large phone has no
    written size anywhere, so it is drawn at the brief's folded size; set `pw` and `ph` to change
    it. Status bar 24 pt and home indicator 20 pt are placeholders, unmeasured. Nothing crosses the
    hinge: each page clips its own overlays.
15. **Apple pages read 2026-11-21** (each answered 200), at `developer.apple.com/tutorials/data/`:
    typography (Dynamic Type default column: Large Title 34, Title 3 20, Body and Headline 17,
    Callout 16, Subhead 15, Footnote 13, Caption 1 12, Caption 2 11; AX5 column used for the AX5
    frame), accessibility (44 x 44 pt default control), buttons (44 x 44 pt hit region), sheets
    (Cancel leading, Done trailing; swipe down dismisses; grabber), popovers (avoid in compact
    width; close on tap outside), menus (checkmarks for the current choice), layout (size classes,
    safe areas), tab-bars, toolbars, pickers, pull-down-buttons, lists-and-tables.
16. **Colour and type.** Colour roles and values are my own (plum accent, cool grey list, white
    paper; a dark set). Type is the system font at Apple's text-style sizes. Spacing is on the
    house 4 pt step, radius 8 pt (panels 14 pt, to read as sheets).

## Critique (impeccable, single context)

The critique ran in one context: this agent has no sub-agent tool. The detector found 5
cramped-padding warnings, all on the mockup's own segmented controls outside the device frames,
where each button fills its segment by design (false alarm), and one advisory on the striped Sample
banner (fixed: plain banner). Own review, fixed: AX5 panel heads shrank and overlapped (fixed);
the Ring's last row sat under the grip (end space added); the AX5 options page ran under the grip
(end space added); Spread cards could cover the whole page (capped at 72%); the open-pose Spread
right page showed a sliver of the empty state (cleared); keyboard focus did not enter or return
from panels (fixed); the count showed twice when no filter was on (panel count now shows only
with a filter). Open: the Ring's hold gesture has no hint before first use.

## Input Needed

- Which concept, or which mix (for example Spread's chips with Tray's toolbar fallback)?
- Should history also log sort and filter changes?
- A size for the large phone.
