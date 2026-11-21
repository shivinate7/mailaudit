# Date and stamp editing: blind designer 1

Designer kind: blind. Mockup: `date-and-stamp-editing-blind-1.html`. It opens from disk, with no server
and no network. Every figure, name and date in it is sample data. The sample "today" is
Friday, November 20, 2026.

The job comes from the brief: "I marked it on the wrong day." The person changes a received date,
picks a range of order dates, and corrects a stamp. They see what will change before it changes, and
they can undo it. The data is a package with an order date, zero or more received dates and a stamp
state, and a range with a start and an end.

## Deep links

Add these to the file URL after `#`. `c` is the option, `s` the state, `d` the device
(`folded`, `open`, `phone`, `ax`, `all`), and `t` the theme (`light`, `dark`; leave it out for the system theme).

- Ledger: `c=ledger&s=` `list`, `detail`, `edit`, `review`, `applied`, `failed`, `stamp`, `stamp-review`, `range`, `range-invalid`, `empty`, `changes`, `undo-blocked`.
- Correction slip: `c=slip&s=` `start`, `date-blank`, `date-pick`, `date-multi`, `date-ready`, `filed`, `failed`, `stamp`, `stamp-date`, `range`, `range-invalid`, `range-empty`, `journal`, `reverse-blocked`.
- Day board: `c=board&s=` `start`, `day`, `multi`, `move`, `moved`, `failed`, `stamp`, `ordered`, `ordered-empty`, `changes`.

Example: `#c=slip&s=date-pick&d=open&t=dark`. Focus ids for the waiting page: `concept-ledger`,
`concept-slip`, `concept-board`. Each option has a Hide control in the shell's Option row.

## Sizes and sources

- Duo folded 466 by 678, and Duo open 951 by 669 with the hinge from x 455.5 to x 495.5. These come
  from the brief: `layout.py devices` printed `unknown` for this repo. In the open pose each page is its
  own 455.5-wide box. A check in the page (`#check=1`) walks each element and fails when one crosses the
  hinge. It passed on every state I listed above.
- Large phone 440 by 956: my pick. Neither the brief nor the device list gives a size.
- Status bar and home indicator insets (44 and 20 on the Duo, 62 and 34 on the phone) are my picks.
  No Apple page I read gives them. The CSS reads `env(safe-area-inset-*)` first.
- Type sizes come from the HIG typography page, Dynamic Type tables "Large (default)" and "AX5".
  Body is 17 pt at the default size and 53 pt at AX5. Read 2026-11-21. Pages read that day, each
  answered 200: layout, typography, accessibility, buttons, sheets, tab-bars, toolbars,
  lists-and-tables and pickers, all under developer.apple.com/design/human-interface-guidelines/.
  The date-pickers page answered 404. Its content is on the pickers page.
- Spacing is a 4 px step and the radius is 8 px, from the house tokens. Colours are my own, by role,
  with a light set and a dark set.

## Choices

1. **Three options, each with its own first screen.** Ledger opens on a list of packages. Correction
   slip opens on "What went wrong?". Day board opens on a calendar.
   Gain: the owner compares three structures, not three skins. Loss: three times the build if more
   than one survives. Pick: show all three and let the owner cull.

2. **The highlighter mark is the one shared signal.** Each value that will change shows struck through,
   with its new value on a yellow mark beside it. All three options use it, in light and dark, and in
   forced colours too, where it gets an outline.
   Gain: one look means "this will change". Loss: yellow is used for nothing else, so no warning can use it.
   Pick: keep it.

3. **Ledger: a two-step sheet (pick, then review).** The pick step shows the old and new value live.
   The review step lists every field that will change, plus "Days in the mail", which is worked out
   from the dates. Nothing is saved until the person presses "Change the date".
   Gain: a native iOS pattern (Cancel on the left, Review on the right). Loss: two taps where one could do.
   Pick: keep the two steps, because the brief says "see exactly what will change before it changes".

4. **Undo in two places.** After a save, an answer line with Undo appears on the changed row (house
   rule ux-answer-at-press). Changes (Ledger, Day board) or Filed (slip) lists every change with Undo or
   Reverse. Undo refuses, and says why, when a later change touched the same value.
   Gain: undo stays reachable after leaving the screen. Loss: one more tab. Pick: keep it.

5. **Correction slip, the bold option.** The person writes the fix as a sentence: "[package] was marked
   received on [day]. It really came on [pick a day]." Each blank is a tap target that opens a tray
   at the bottom, in reach of the thumb. A carbon copy under the sentence shows the whole record as it
   will be. No common app of this kind starts with a sentence instead of a list.
   Gain: the screen speaks the person's own words, and the carbon shows the whole result.
   Loss: a sentence is slower to scan than a list when there are many fixes in a row. Pick: show it.

6. **Filing is append-only in Correction slip.** Reverse files a new reversal slip. Nothing is erased,
   so the record of every change stays. Back keeps an unfiled slip, and the starter says so.
   Gain: a full trail of what changed and when. Loss: the Filed list grows with each reversal.
   Pick: show it. Owner grant: yes. This adds a kept history of changes that the brief does not name.

7. **Day board: move a package to another day.** Tap a day, then "Move to another day", then the day it
   really came. A bar at the bottom shows the change, with Cancel and "Move it". The same calendar,
   switched to "Order days", picks a range with two taps. A second tap that falls before the first one
   becomes the start, so the range is never in the wrong order.
   Gain: the job ("the wrong day") is literally a day on a calendar. Loss: a package with no received
   date shows only under Order days, and its stamp cannot be changed there in this draw. Pick: show it,
   and add a stamp control to the Order days rows if this option survives.

8. **Several received dates.** Ledger lists each date as its own row. Slip asks "Which received date is
   wrong?" when a package has more than one. Day board says "Arrival 2 of 2; the other came Nov 4".
   Gain: the person always names the exact date that changes. Loss: none seen. Pick: keep it.

9. **Allowed days.** A received date cannot fall before the order date or after today. Tapping such a
   day says why, under the calendar. A date the package already has is refused, with a reason.
   Gain: prevents the common slip of a wrong month. Loss: the person cannot record a date ahead of
   time. Pick: keep it. Owner grant: yes. This is a rule on the data, not only on the screen.

10. **The stamp follows the dates, on request.** Removing the last received date offers "Also change
    the stamp" back to Expected, as a switch, on by default. Setting the stamp to Received with no date
    adds today as the received date and says so.
    Gain: the stamp and the dates do not disagree. Loss: one change can touch two fields; the review
    shows both. Pick: keep it. Owner grant: yes. It links two fields that the brief keeps apart.

11. **Stamp states are my assumption.** The brief names a stamp state but not its values. I drew four:
    Expected, Received, Part received and Overdue, each with its own icon shape (outline, filled with a
    tick, half filled, dashed with a mark). Owner grant: yes. The real set replaces these.

12. **Largest text (AX5).** Seven calendar columns cannot hold 53 pt digits, so the calendar becomes a
    day stepper ("One day earlier", "One day later", "Today"), and the board becomes a list of days.
    Bar buttons and titles stay at 17 pt, as iOS bars cap them. The whole screen scrolls as one, so a
    footer never covers the content it acts on.
    Gain: no truncated digit. Loss: a jump of many days takes many taps. Pick: keep it.

13. **Open pose.** Ledger: list on the left, the package on the right, and the edit sheet on the right
    page only. Slip: the sentence and tray on the left, the carbon copy and Filed on the right. Day
    board: the calendar on the left, the day and the change bar on the right. Tab bars stay on the left page.
    Gain: the cause and the result sit side by side. Loss: a sheet covers only half the device.
    Pick: keep it.

14. **Save failed.** Each option has a failed state: "Not saved. Nothing changed." with Try again, at the
    button that was pressed. Gain: a failure never looks like a success. Loss: none. Pick: keep it.

15. **Haptics.** Not drawn. A move, a stamp change and a filing should each give a light haptic on save
    (house rule ux-haptics-feel-substantial). The builder adds them; a mockup cannot show one.

## Run notes

- The repo's own instructions file loaded into my context automatically, before I read the brief. I
  used none of its names, views or terms. This run is therefore less blind than a clean one.
- No branch was named in the brief, so nothing was pushed.
- A tap test clicked through each option's main flow in all four frames: 40 checks passed.
