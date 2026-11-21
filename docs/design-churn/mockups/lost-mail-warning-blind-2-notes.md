# Lost mail warning: blind designer 2 notes

Designer kind: blind. Mockup: `lost-mail-warning-blind-2.html`, in this folder. Every figure in it is sample data.

As a blind designer I saw no current screen, spec or token file, so no choice here cites existing
behaviour by file and symbol, and no part is labelled "Today:". Every dashed label reads "New:".

## Deep links

Append to the file URL. Keys: `c` jumps to a concept, `s` sets the state, `t` sets the theme, `off` hides options (joined with `.`).

- Concepts: `#c=list`, `#c=runway`, `#c=deck`
- States: `#s=many` (30 packages, 23 late), `#s=allwell`, `#s=unknown`, `#s=empty`, `#s=loading`, `#s=failed` (loaded is the default)
- Themes: `#t=light`, `#t=dark` (no `t` follows the system)
- Hide: `#off=runway`, `#off=short.closed.later.labels`
- Focus ids for each concept: `list-folded`, `runway-folded`, `deck-folded`

Each concept draws four frames: Duo folded (466 x 678), Duo open (951 x 669, hinge 455.5 to 495.5),
Duo folded at AX5, and a large phone.

## Choices

1. **Three concepts.** Deadline list (a sorted list in a new tab), Runway (the bold one: a 30-day
   track where position is age), One by one (the app asks about each late package in turn). Gain: the
   owner sees three different ways to answer "tell me before day 31". Loss: three to cull. Pick:
   Runway, because the deadline is the subject and the runway makes it visible at a glance; the
   urgent end sits by the thumb. Each concept has a Hide button.

2. **Where the warning reaches the person.** Deadline list: a badge with the late count on a new
   Overdue tab (the person goes to look). Runway: the same tab and badge. One by one: a prompt above
   the tab bar on the screen already in use (the app comes to the person). Gain of the prompt: no
   hunting at all. Loss: it takes space on another screen until answered. Pick: badge for list and
   runway, prompt for one by one; a push notification is outside this mockup. Owner grant: yes (the
   prompt sits on a screen outside this brief).

3. **Urgent from 7 days left (day 23).** The brief says "near 30 days is urgent" with no number. Other
   options: 5 days or 10 days. Gain of 7: one full week to file. Loss: urgent holds three of seven
   sample packages, which dilutes it. Pick: 7. Owner grant: yes (a new rule).

4. **Nudge from day 14 with nothing received; untracked only.** From the brief. Tracked packages are
   left out; one sentence says how many ("14 packages with tracking are left to the carrier").

5. **Window closed group.** A package past day 30 shows in a collapsed group (list) or a bin (runway),
   with its count and money. Gain: the person learns what was missed. Loss: a closed claim may only
   upset. Pick: show it, collapsed. Control "Window closed group" hides it.

6. **Arrived short group.** An order with some but not all cards in, 14 days or more old, shows apart
   from lost mail. The brief's rule names "nothing received" only. Gain: missing cards also need a
   claim. Loss: it widens the screen's job. Pick: show it. Control "Arrived short group" hides it.
   Owner grant: yes (widens the rule).

7. **Money stuck.** The hero figure sums the money owed on late packages (closing soon plus late). It
   leaves out closed and short orders, which show their own subtotal. Each group header carries its
   subtotal, so "how much is stuck" is answered without adding.

8. **Three answers per package: Claim filed, It arrived, Ask me again in 3 days.** The app cannot file
   a claim, so "Claim filed" records that the person did. A filed package leaves the late list for a
   "Claim filed" group. Gain: the list ends at nothing to do. Loss: it adds a filed date and a
   later date to each order, a new saved field. Pick: all three. Owner grant: yes (invariant
   `saved-state-shape`, saved-state shape is fixed, would change; a builder and a record are needed).

9. **Ask me later.** Waits 3 days and is offered only while a package has more than 7 days left, so an
   urgent package cannot be put off. Control "Ask me later" hides it. Pick: keep, 3 days.

10. **Answer at the press.** After a press the button area turns into the answer ("Marked arrived on
    21 Nov.") with Undo in the same place. The area keeps the size of its larger state, so nothing
    moves. One by one never moves on by itself: "Next package" takes the place of the pressed button.
    The other rows keep their order; the next row takes the acted row's slot.

11. **Missing order dates.** An order with no date has an unknown deadline. The screen says so in one
    sentence with "Show them", and the hero reads "At least this much is stuck". The prompt says those
    orders are not checked. Never shown as empty or done.

12. **States.** Loading (skeletons at the loaded size, "Reading your orders"), failed ("Your orders did
    not load." with Try again and a closed "What the app said"), no orders ("Import your orders to see
    which packages are late." with Import orders), nothing late ("All is well." only), missing dates.
    Import is a stub in the mockup: it says "Sample only".

13. **Open pose.** Each pose has its own layout. List and runway: the list or runway on the left page,
    the selected package on the right; the most urgent is selected first. One by one: the card on the
    left page, the queue of this run on the right, where any row jumps to its card. The tab bar sits
    on the left page only. A check confirms that nothing crosses the hinge gap.

14. **AX5.** All text uses the AX5 sizes from the typography page. The runway becomes a ladder (one
    rung per package, day above money and seller), because chips cannot sit at their day at that size.
    Rows wrap the money under the name. The tab bar, nav bar and sheet bar keep the default size: an
    assumption, since no page I read gives their size at AX5.

15. **Large phone size.** No size is written for it: `layout.py devices` answers "unknown" and the
    layout page no longer lists device sizes (change log, 9 Sep 2026). The frame starts at the folded
    size and can be dragged to any size; the layout is fluid. Input needed: the size to draw.

16. **Status bar and home indicator.** No page I read gives their height. The status bar is drawn at
    44 pt (the control size) and the home indicator at 20 pt, as stand-ins, inside the safe-area
    padding, which uses `env(safe-area-inset-*)`.

17. **Tab bar shape.** A floating capsule, as the tab bars page describes. This departs from the house
    8 px radius (tokens.md); every other corner uses 8 px. Pick: capsule, to look native.

18. **Colour and type.** Colours by role, light and dark, my own values (house rules give none). Urgent
    is a deep red with a red tint; late is an amber ring; closed is grey; done is green. Each status
    also has its own shape (filled dot, ring, dash, square), so colour is never the only cue. Type is
    the system font with Dynamic Type sizes in pt, drawn 1 pt = 1 px.

19. **Seller name.** The brief's data shape has no seller. A package needs a name to find it on a claim
    form, so each row shows one. Input needed: confirm the order carries a seller name.

20. **Many late packages.** The person buys hundreds of packages, so the "Many late" state draws 23
    late ones. Runway: packages of the same day share one chip ("3 packages, day 16"); a tap opens
    that day's list, then a package. The runway stays one chip per day, at most 17 chips. Deadline
    list: a longer list, with group subtotals. One by one: 23 cards in a row is slow. Gain of one by
    one: no package is skipped by accident. Loss: a busy month takes many presses. Pick: keep it, and
    let the owner judge it in this state.

21. **Critique pass (impeccable critique, this designer's own review).** Fixed: sheets replayed their
    entry animation on every press (content moved under the finger); list rows collapsed to zero
    height inside the scroll area; bars grew to AX5 and overlapped; the "New" label sat above sheets;
    the runway had no answer for many packages (item 20); the Overdue badge was missing in the many
    state; "Day 16" showed twice on one sheet; four "X. No Y." sentences in the page copy. Not fixed:
    disabled "Previous" on the first card gives its reason on hover only, which a touch screen lacks.

## Apple pages read, 2026-11-21

Each read through its `tutorials/data` JSON; each answered 200.

- layout: safe areas; lay out by size class. No device sizes on the page now.
- typography: Dynamic Type sizes, Large (default) and AX5 tables.
- accessibility: 44x44 pt default control size; text to 200 percent.
- buttons: 44x44 pt hit region.
- sheets: Cancel or Close on the leading edge.
- lists-and-tables: text in lists.
- tab-bars: the tab bar floats above content at the bottom.
- toolbars: large title, standard title on scroll.
