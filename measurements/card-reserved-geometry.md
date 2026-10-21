# Card reserved geometry heights

**Status:** Tally figures and row shift re-measured at `1607933` (the fix commit) on 2026-10-14. The records writer took them with a scratch probe, built from the `check:screens` seed and row code. The probe is not committed. Packages figures were checked at 320, 375 and 760px on the same head. The action-row figures are from the grid head `f97e423`, and were not re-measured. The Packages figures predate the order id's own line in the header (`order-id-button-stops-propagate`) and are not re-measured. Debt: `packages-header-geometry-unmeasured`.

This record holds the package card and Tally card heights across a check-in. It holds the row displacement, the action row content needed per width, and the 320px case left unfixed. Re-measure at 375px, and at the widths listed, after a change to the progress bar or the action row.

## How to re-measure

Open the built page against the `LEDGER` fixture in `test/screens.mjs`. Step through rest, the first check-in, the second check-in, and the tap that completes the package. Measure the card height and the row displacement at each step. Repeat the action row content measurement at 320, 360, 375, 390, 430, and 760px. Re-run the card and content-height figures by hand, in a real browser. `npm run check:screens` automates the row shift at 375px and 760px. See Reader below. jsdom has no layout and cannot do this measurement.

The figures in this record were taken with headless Chromium through Playwright 1.63.0, the version in `package.json`. The page was `index.html` at `1607933` for the Tally and Packages figures, and at `f97e423` for the action-row figures. The data was the `LEDGER` fixture in `test/screens.mjs`. Motion was reduced. Each tap went to the centre of its row. The Packages steps and the Tally steps ran with the Everything filter on, so a completed card stays on screen. The Ledger tab holds that filter. The Packages card starts expanded. The Tally card opens on a tap of its header.

## Reader

`npm run check:screens` (`test/screens.mjs`, claim 2) is the reader for the row shift. CI runs it in the `screens` job of `.github/workflows/test.yml`, on `macos-latest`. At 375px and 760px it checks each check-in through completion. It covers four card views: Packages and Tally, each under Everything and Unreceived. Packages under Unreceived stops one check-in short, because its completed package leaves the view. It fails if any other row moves more than 0.5px. It runs on its own fixture, not the user's ledger, and checks no other width. The card heights and the content-height table have no reader. jsdom has no layout, so the suite cannot hold them.

## The defect

Before the fix, measured at 375px against the seeded ledger, the first check-in in a package grew its card by 28px. It pushed every remaining row in the card down by 28px. The rows moved directly under the thumb that had just tapped one of them. This breaks `no-layout-shift-under-pointer`, on the most common gesture in the app. The masthead save indicator had a smaller version of the same defect. The defect is independent of the motion pass and of the save-slot fix.

There were two unrelated causes. Each needed its own fix.

### The progress bar is out of flow

The progress bar is out of flow, not reserved a slot. Before the fix, it mounted between the header and the item rows on the first check-in. That was a 15px child appearing above everything it displaced.

It now sits on the card's own top edge. The element is `edgeBar`. It is absolutely positioned inside the card's existing `overflow: hidden` rounded box, so the card corner does its rounding. The corner is 8px at `f97e423` (10px before `528bbde`). That is why `ProgressBar` has a `radius` prop separate from `height`. This keeps the bar from becoming a pill floating inside another shape. The bar catches no taps. It can mount and unmount without moving anything. It is 3px tall, because it is a rule on an edge now, not a bar in a row.

The bar is out of flow for a reason that is not about layout. It is what lets the `gotQty > 0 && !done` gate stand. A reserved slot would have to stay mounted through completion. The bar would then render at 100% and sheen. The gild in the motion design is the sole marker of a package completing, precisely because the bar cannot survive to be one. Test 44.5 fails if the gate goes. Read that failure as "this is a change to the motion design", not as a broken refactor.

The Tally card has `position: relative` for the same bar. PackageCard already had one for `.mdl-gild`. Without it, the bar escapes to the nearest positioned ancestor and draws somewhere else on the page entirely. That is why 44.2 and 44.7 pin both.

### The action row is reserved at its tallest state

The action row is reserved at its tallest state, `BULK_ROW_H`, which is 46px of content. Its membership changes on the same tap. "Clear check-ins" joins "Stamp" and "Mark all received". At 375px those three want 60.6 + 143.7 + 129.9 plus two 8px gaps. That is **350px in the 313px a card gives them**. Both bulk labels wrap to a second line, and the row goes from 31px to 46px. It shrinks by the same 15px on the tap that *completes* a package, where "Mark all received" leaves. Reserving the tallest state pins both transitions at once.

This is a counted constant, like the save slot's 13ch. It goes stale the same way: two lines of 11.5px mono plus `miniBtn`'s 8px padding.

The Tally card's row is deliberately not reserved. It has no Stamp button, so its two buttons are 282px of the same 313px. Neither wraps, so it is one line in every state. At `f97e423` that held at 360px and wider. At 320px the first check-in grows the Tally card by 14px, the same on `c4eb9d5`, so the one-line claim does not hold there. If a third control is added there, reserve it then. Measure rather than assume that 44px fits.

## Figures

Tally and Packages figures are at `1607933`, measured 2026-10-14. Action-row figures are at `f97e423`.

**Packages card (Alpha Cards, 3 rows).** At rest and after each of the three check-ins, the card is **335.67px** tall at 320, 375 and 760px. That includes the check-in that completes the package. Every other row moves **0.00px** on every step. Its rows measure the same at `c07ae27`. At `f97e423` the card held 335.67px, with 0.00px of row shift and no horizontal overflow at 320, 360, 375, 390, 430 and 760px.

**Tally card (Lightning Bolt, 6 copies), at `1607933`.** At 375px and 760px the card is **673.34px** at rest and after every check-in. Other rows move **0.00px** on every step. At 320px it is 673.34px at rest, 687.34px after check-ins 1 to 5, and 673.34px after check-in 6. Rows move **14px** down on check-in 1 and **14px** back up on check-in 6. The 320px step is a named limit (see The 320px exception).

At `c07ae27`, before the fix, the same probe gave 685.34px at rest at 375px and 760px. After check-ins 1 to 6 the card was 685.34, 685.34, 681.34, 677.34, 673.34 and 659.84px. Other rows moved **4px** up on check-ins 3, 4 and 5, and **13.5px** up on check-in 6. At 320px, check-in 1 moved them 14px down and check-in 6 moved them 27.5px up. There were two causes, each fixed on its own:

- **The warning line on a copy row.** `ItemRow` set its meta line to `normal` line height. The ⚠ glyph falls back to a taller font, so a row with the warning grows 4px, from 13px to 17px. Three rows were 4px taller at rest, so the rest height was 12px more. `ItemRow` now sets 13px. Rows without the warning measure the same, so Packages did not change.
- **The outstanding line in the header.** `ItemTotalRow` unmounted its "N left · $" line on the tap that completes the copy. That took 13.5px off the header, and every row moved up. The line now stays mounted and hidden. See `card-tally-row-counts-first`.

The rest-height change moves the drawn boxes of the open Tally card. Claim 10 reads those boxes. It was red at `1607933` against base boxes recorded before this change, and its base was re-recorded at `a95b180` and committed in `f426c12`. Claim 11 was red at `1607933` too, but for another cause: a scroll-position artifact at the search pill's edge. Its fixed-versus-content pairs are skipped now (see `ux-house-rules-govern`, the house UX decision).

**Action row content at rest.** With "Stamp" and "Mark all received" showing, the row needs **32px** of content at each of 320, 360, 375, 390, 430 and 760px. The reserved row box is 54px: 46px of `min-height` in content-box, plus the 8px bottom padding.

**Action row content at the tallest state (not re-measured).** Before the grid lane, the content need against the 46px reservation was 57px at 320px and 46px at 360, 375 and 390px. It was 31px at 430px and at 760px. The record writer's probe did not reproduce the three-button state, with "Clear check-ins" showing. So this table is unmeasured at `f97e423`. Debt: `card-action-row-unmeasured`.

At the 46px reservation, the first check-in moves no item row at 360, 375 or 390px: 0.00px at `f97e423`.

## The 320px exception

At `1607933` the Packages card moves 0.00px at 320px. The three-button state this paragraph describes was not reproduced, so the 11px step is unmeasured at the grid head (debt `card-eleven-px-step-unmeasured`). The Tally card does move at 320px, by 14px on check-ins 1 and 6 (see Figures). That is debt `tally-card-moves-at-320px`. No shipped check reads 320px: claim 2 runs at 375px and 760px only.

**320px is the one width this does not fully fix.** Three buttons wrap to a *third* line there, and the row still steps 11px. The bar half is width-independent, so at 320px the shift falls from 28px to 11px. This is left deliberately. 320px is below the app's stated 380px floor. It is not a viewport that current iOS runs. Reserving 57px would fix 320px by spending 26px of dead space in every expanded card at the widths that are real.

If the fix is ever wanted, get it without dead space. Keep all three buttons mounted and hide the inapplicable one. The row then measures itself at every width. The cost is that the visible label wraps at rest. That is a look, so it is a decision for the owner, not a fix to apply.
