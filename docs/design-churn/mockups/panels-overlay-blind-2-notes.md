# Panels over a long list: blind designer 2

Designer kind: blind. Designer: panels-overlay-blind-2. Mockup: `panels-overlay-blind-2.html`.

The job: small option panels (sort, filter, what to show, change history) open over a long list.
The list must not move, the panel sits on solid paper, and one gesture closes it.

Two options. Each has a Hide button on the page.

- **Thumb sheet** (`#c=thumb-sheet`, focus `opt-thumb-sheet`): a bar of four panel buttons under
  the thumb. A tap raises a solid sheet.
- **Corner fan** (`#c=corner-fan`, focus `opt-corner-fan`): the bold one. One corner button. A
  press and a slide pick a choice, and the lift closes the fan.

## Deep links

Add these to the page URL. You can combine them with `&`.

- Option: `c=thumb-sheet`, `c=corner-fan`.
- State: `s=list`, `s=sort`, `s=filter`, `s=show`, `s=history`, `s=history-custom`,
  `s=history-failed`, `s=history-empty`, `s=empty` (a filter emptied the list).
- Theme: `t=light`, `t=dark`. With no `t`, the system setting decides.
- `l=0` hides the "New:" labels. `h=corner-fan` hides that option.
- `selftest=1` runs the page's own check. It writes PASS or FAIL in the tab title.

Owner views:

- `#c=thumb-sheet&s=filter` shows the filter sheet raised over the list.
- `#c=corner-fan&s=filter` shows the fan bloomed on its Filter sector.

## Frames

Each option is drawn in four frames, in this order:

1. Duo folded, 466 x 678 pt.
2. Duo open, 951 x 669 pt. The hinge is at x 455.5 to 495.5, and nothing sits across it. The self
   test checks this.
3. Large phone. This is a stand-in frame, 466 x 900 pt. The brief writes no size, and no Apple page
   I read gives one.
4. Duo folded at AX5, the largest accessibility text size.

The frames come in light and dark.

## Sources

Apple pages, read 2026-11-21. Each answered 200.

- [layout](https://developer.apple.com/design/human-interface-guidelines/layout): safe areas, and
  layout by size class. The page held no device dimension table.
- [typography](https://developer.apple.com/design/human-interface-guidelines/typography): the
  Dynamic Type text styles, Large (default) and AX5.
  - Large: Large Title 34/41, Body 17/22, Subhead 15/20, Footnote 13/18, Caption 1 12/16.
  - AX5: Large Title 60/70, Body 53/62, Subhead 49/58, Footnote 44/52, Caption 1 43/51.
- [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and
  [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons): a 44 x 44 pt hit
  region.
- [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): a nonmodal sheet,
  medium and large detents, a grabber that you drag or tap to cycle detents, and a swipe down to
  dismiss.
- [popovers](https://developer.apple.com/design/human-interface-guidelines/popovers): one tap closes
  one panel and opens another. A panel closes on a tap outside, and on a pick when only one choice
  is allowed. Show no popover in compact width.
- [toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars),
  [tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) and
  [lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables).

These numbers are my own choice, not Apple's:

- Status area 44 pt and home-indicator area 20 pt. Both are drawn as padding beside
  `env(safe-area-inset-*)`.
- Fan radii: sectors at 152 pt, choices at 226 pt, paper disc 384 pt.
- Fan button 56 pt, and 88 pt at AX5.
- Medium detent at 55 % of the space above the bar.
- Back and close in the sheet bar stay at 34 pt at AX5.

The colours are my own and are named by role. Spacing is on the 4 px step. The radius is 8 px.

## Sample figures

The list is a made-up pantry: 40 items, each with a shelf, a date added, an amount and a stock
state. The brief gave no data shape. I chose a neutral one that I know from no product. No "Today:"
labels are drawn, because a blind designer does not see today's screen. Every "New:" label marks
something this design adds.

## Choices

1. **No push, ever. Every panel is drawn above the list in its own layer.**
   - Gain: the list's DOM and its scroll position are never rebuilt when a panel opens or closes.
     The self test scrolls each list, then opens and closes every panel by every close gesture.
     The tracked row stays within 0.5 pt (92 checks, plus a check that the page never scrolls sideways).
   - Loss: a panel covers part of the list while it is open.
   - Pick: yes, in both options.

2. **Thumb sheet: a bar of four buttons (Sort, Filter, Show, History) at the bottom edge.**
   - Gain: every panel is one tap away, in the thumb zone.
   - Gain: the bar stays visible above the sheet, so a tap on another button swaps the panel in one
     tap.
   - Gain: a dot on Filter shows that a filter is on.
   - Loss: 76 pt of the folded screen is spent on the bar at all times.
   - Pick: yes.

3. **Thumb sheet: one gesture to close.** Any one of these closes the sheet: a tap on the same
   button, a tap on the list, a swipe down on the grabber, or a tap on the close button.
   - A tap on the list only closes the sheet. It does not also act on the row, so a stray tap
     changes nothing.
   - Gain: no close target to hunt for.
   - Loss: the first tap on the list does nothing to the list.
   - Pick: yes.

4. **Thumb sheet: the sheet rests at a medium detent, about half the space above the bar.**
   - A tap or an upward drag on the grabber goes to the large detent.
   - Gain: the top half of the list stays in view.
   - Loss: long history needs a scroll or the large detent.
   - Pick: yes.

5. **A single choice closes the panel. A multiple choice keeps it open.**
   - Sort closes on the pick. Filter and Show stay open until a close gesture. This follows the
     popovers page.
   - Gain: one tap for a sort, and no reopening while you build a filter.
   - Loss: the two kinds close differently.
   - Pick: yes.

6. **Thumb sheet, Duo open: the panels move to the second screen.**
   - The four buttons sit at the bottom of that screen, and the list has the whole first screen.
     Nothing ever covers the list.
   - Gain: you see the effect of each choice beside the choice.
   - Loss: the second screen holds no detail view while panels live there.
   - Pick: yes.

7. **Thumb sheet at AX5: the four-button bar becomes one Options button.**
   - Options opens a large sheet with the four panels as rows, and Back returns to them.
   - Gain: the labels stay whole at 53 pt.
   - Loss: each panel is two taps away instead of one.
   - Pick: yes.

8. **Corner fan (bold): no bar. One 56 pt button sits in the trailing corner.**
   - Press it, slide across a sector (Sort, Filter, Show, History) and its choices bloom on an
     outer arc. Slide to a choice and lift: the choice applies and the fan closes. That is one
     gesture.
   - A plain tap opens the fan for taps instead.
   - The choices lie on the thumb's arc, and the first choice sits level with the button.
   - Gain: the most direct path. No bar takes space, and the list gets the whole screen when the
     fan is shut.
   - Loss: it is new to people and must be learned.
   - Loss: the open disc covers the lower right of the folded screen, about 55 % of its height.
     The top rows and the left edge stay in view.
   - Loss: a press and slide has no VoiceOver form. Taps on each part are the accessible path.
   - Pick: yes, as the bold option.
   - Owner grant: yes. It departs from the house rule that phone navigation uses a bottom tab bar
     (tokens.md, Font and navigation). The fan is options, not navigation, but it is the only
     control on the screen.

9. **Corner fan: a line under the title states the settings in force**, for example "Newest added.
   Low. 7 of 40."
   - Gain: you know why the list looks the way it does, with the fan shut.
   - Loss: one line of text that the bar option does not need.
   - Pick: yes.

10. **Corner fan: History opens a solid card that grows from the corner**, not a fan arc. Its
    entries and dates do not fit on an arc.
    - On the Duo open, History is the whole second screen, "Changes". It always shows, and the
      fan there has three sectors. The fan sits in the leading corner of the first screen, for the
      left thumb.
    - Gain: history is readable, and on the open Duo it never covers the list.
    - Loss: one sector behaves unlike the other three.
    - Pick: yes.

11. **Corner fan at AX5: the fan becomes a stack of full-width rows over the button.** The fan's
    circles cannot hold 53 pt text.
    - Gain: the text stays readable, and the same corner button opens it.
    - Loss: the press-and-slide is lost at AX5.
    - Pick: yes.

12. **History states.** History shows a range control (Today, 7 days, 30 days, Dates). Dates opens
    From and To fields.
    - A failed read says "Changes could not load." and gives Try again. The machine text sits
      inside a closed disclosure.
    - An empty range says one sentence and gives "Show 30 days".
    - Gain: the failed state and the empty state never pass for each other (ux-unknown-is-not-empty).
    - Pick: yes.

13. **A filter that empties the list.**
    - The list shows "Nothing matches these filters." and Clear filters.
    - The filter control stays reachable, and its dot stays on.
    - Pick: yes.

14. **Filter answers at the press.** "N of 40 match" sits under the chips in the sheet, and at the
    top of the pill column in the fan.
    - Pick: yes.

15. **Haptics: a light tap when a choice applies**, and on each sector the fan's slide crosses. A
    mockup cannot show it. It is noted for the builder (ux-haptics-feel-substantial).
    - Pick: yes.

16. **Radius: 8 pt on sheets, cards and controls, from the house token.**
    - Native iOS sheets use a larger corner.
    - Gain: one radius everywhere.
    - Loss: a little less native.
    - Pick: 8 pt.
    - Owner grant: no.

17. **Corner fan: a hint on the open disc.** When the fan is opened by a tap, it says "Next time,
    press and slide to a choice, then lift." The hint goes once a sector is picked.
    - Gain: a person who taps learns the one-gesture path.
    - Loss: one more line of text on the disc.
    - Pick: yes. This was added after the critique.

## Input needed

- The size of the large phone. It is drawn as a stand-in at 466 x 900 pt. Not blocking.
- Item 8, the Corner fan with no bottom bar. Owner grant: yes.
