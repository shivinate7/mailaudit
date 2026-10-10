# Ruled head control region heights

This record holds the control region height at 375px, in each state. States are: at rest, with a panel open, and with the action row empty or full. It also holds the one width bug the region had, at 377px. Re-measure at 375px after a change to the region's cells, panels, or the action row.

## How to re-measure

Open the built page at a 375px viewport. Load a real ledger. Measure from the top of the view switch to the top of the first package card. Do this for each state named below. Compare the result against the figures below. The prose gives no script name. Re-run this by hand in a real browser. jsdom has no layout and cannot do this measurement.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.

## Grid tracks

- **`grid-template-columns: repeat(3, minmax(0, 1fr))`, never `1fr`.** A bare `1fr` is `minmax(auto, 1fr)`. So a long value expands its track past its third and squeezes the other two.
- `text-overflow: ellipsis` does nothing on a flex container. It has to sit on the text child. That child also needs `min-width: 0`, or it refuses to shrink.
- Measured before this was fixed: a 25-character sort label took its cell from 114px to 182px. It pushed the document to **377px in a 375px viewport**.
- jsdom has no layout, so **no assertion can catch a regression here**. Re-measure at 375px if you touch it.
- The Find row holds two cells with `flexShrink: 0`. The search input absorbs the loss. Re-measure at 375px if either label grows.

## Control height

Every control inside the panels shares one height, `CTL_H`, which is currently 34px. The shared controls are `optCell`, the day-stepper `well`, and the token `keyField`.

Before `CTL_H` existed, chips were `5px 11px`, selects were `9px 8px`, and buttons were `9px 12px`. Nothing shared a baseline, and the rows wrapped raggedly. That mismatch, not the colors, is what read as unfinished. Change `CTL_H` and every panel follows.

The boxed `ctl` and `chip` controls the constant was written for are gone. The last of them, the file actions and the Sync panel's buttons, became the ruled action row and an option grid. So nothing in the region is a rounded box.

`keyField` sets `boxSizing: border-box`. Inputs are content-box by default, while buttons are not. Without this rule, the field renders 2px taller than the Save cell beside it.

## Measured heights

Measured at 375px against 281 real lines across 150 orders, from the view switch to the first package card:

- **185px at rest.**
- 282px with the range panel open.
- 326px showing "last N days".
- 467px showing the month picker.

Horizontal overflow is 0 in every state, and no option string clips.

The resting figure is **14px worse than the 171px it replaced**. That is a deliberate trade. Both native controls are gone. The state reads at a glance, instead of being inferred from four separate controls. Nothing in the region wraps or reflows when the view changes. If the height ever has to come back, the `.fig` line and the cell padding are where to look.

## Action row

The action row was re-measured in real Chromium. The test used the user's actual ledger: 793 lines and 3 envelopes. The old build and the new build ran through the same script. The measure runs from the top of the view switch to the top of the first card.

- At 375px, the resting row fell from **214px to 203px**. The 40px ruled row replaces a 51px padded tray.
- Armed Reset fell from 256px to 203px. It no longer wraps onto a second line.
- An empty ledger fell from 69px to 58px.
- Every one of 24 width-by-state combinations has 0px horizontal overflow.

One figure went the other way. The open Sync panel grew from **357px to 419px at 375px**. At 760px it grew from 320px to 406px. The two-column option grid stacks three rows where the flex-wrap fitted two (one at 760px). The particulars sit on three ruled lines instead of two crammed ones. This cost is paid only while the disclosure is open. In return, the panel looks like its two siblings instead of like the tray the region replaced.

At 375px the three action cells measure 114.3px each. The grid's halves measure 161px. Re-check these fits if the type changes:

- "SYNC · 09-02 ▾" in a third.
- "Tap again to replace" in a half.
