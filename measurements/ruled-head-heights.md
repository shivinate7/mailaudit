# Ruled head control region heights

This record holds the control region height at 375px, in each state. States are: at rest, with a panel open, and with the action row empty or full. It also holds the one width bug the region had, at 377px. Re-measure at 375px after a change to the region's cells, panels, or the action row.

## How to re-measure

Open the built page at a 375px viewport. Load a real ledger. Measure from the top of the view switch to the top of the first package card. Do this for each state named below. Compare the result against the figures in the fence. The prose gives no script name. Re-run this by hand in a real browser. jsdom has no layout and cannot do this measurement.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.

## The figures, as recorded

```
- **`grid-template-columns: repeat(3, minmax(0, 1fr))`, never `1fr`.** A bare
  `1fr` is `minmax(auto, 1fr)`, so a long value expands its track past its third
  and squeezes the other two. And `text-overflow: ellipsis` does nothing on a
  flex container — it has to sit on the text child, which also needs
  `min-width: 0` or it refuses to shrink. Measured before this was fixed: a
  25-character sort label took its cell from 114px to 182px and pushed the
  document to **377px in a 375px viewport**. jsdom has no layout, so **no
  assertion can catch a regression here** — re-measure at 375px if you touch it.

Every control inside the panels shares one height — `CTL_H`, currently 34px
— via `optCell`, the day-stepper `well` and the token `keyField`. Before
that existed, chips were `5px 11px`, selects `9px 8px` and buttons
`9px 12px`, so nothing shared a baseline and the rows wrapped raggedly;
**that mismatch, not the colours, is what read as unfinished.** Change
`CTL_H` and every panel follows. The boxed `ctl`/`chip` controls the
constant was written for are gone — the last of them, the file actions and
the Sync panel's buttons, became the ruled action row and an option grid — so
nothing in the region is a rounded box any more. Note `keyField` sets
`boxSizing: border-box` because inputs are content-box by default while
buttons are not; without it the field renders 2px taller than the Save cell
beside it.

Measured at 375px against 281 real lines across 150 orders, from the view
switch to the first package card: **185px at rest**, 282px with the range panel
open, 326px showing "last N days", 467px showing the month picker. Horizontal
overflow is 0 in every state and no option string clips.

Note the resting figure is **14px worse than the 171px it replaced**, and that
is the trade, made knowingly: what was bought is that both native controls are
gone, the state reads at a glance instead of having to be inferred from four
separate controls, and nothing in the region wraps or reflows when the view
changes. If the height ever has to come back, the `.fig` line and the cell
padding are where it is.

The action row was then re-measured in real Chromium against the user's actual
ledger (793 lines, 3 envelopes), old build and new through the same script,
from the top of the view switch to the top of the first card: at 375px
**214px → 203px at rest** (the 40px ruled row replaces a 51px padded tray),
armed Reset 256px → 203px (it no longer wraps onto a second line), an empty
ledger 69px → 58px, and every one of 24 width × state combinations at 0px
horizontal overflow. The one figure that went the other way is the open Sync
panel, **357px → 419px at 375px** (320px → 406px at 760px): the two-column
option grid stacks three rows where the flex-wrap fitted two (one at 760), and
the particulars sit on three ruled lines instead of two crammed ones. That is
paid only while the disclosure is open, and it buys the panel looking like
its two siblings rather than like the tray the region replaced. At 375px the
three action cells measure 114.3px each and the grid's halves 161px; the fits
worth re-checking if the type changes are "SYNC · 09-02 ▾" in a third and
"Tap again to replace" in a half.
```
