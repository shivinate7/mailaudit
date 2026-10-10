# Card reserved geometry heights

This record holds the package card and Tally card heights across a check-in. It holds the row displacement, the action row content needed per width, and the 320px case left unfixed. Re-measure at 375px, and at the widths listed, after a change to the progress bar or the action row.

## How to re-measure

Open the built page against the seeded ledger. Step through rest, the first check-in, the second check-in, and the tap that completes the package. Measure the card height and the row displacement at each step. Repeat the action row content measurement at 320, 360, 375, 390, 430, and 760px. Re-run the card and content-height figures by hand, in a real browser. `npm run check:screens` automates one part, the 375px row shift. See Reader below. jsdom has no layout and cannot do this measurement.

## Reader

`npm run check:screens` (`test/screens.mjs`) is the reader for the row shift. CI runs it in the `screens` job of `.github/workflows/test.yml`, on `macos-latest`. At 375px, on the Packages and Tally cards, it fails if any other row moves more than 0.5px after a first check-in. It runs on its own fixture, not the user's ledger, and it checks row shift at no other width. The card heights and the content-height table have no reader. jsdom has no layout, so the suite cannot hold them.

## The defect

Before the fix, measured at 375px against the seeded ledger, the first check-in in a package grew its card by 28px. It pushed every remaining row in the card down by 28px. The rows moved directly under the thumb that had just tapped one of them. This breaks `no-layout-shift-under-pointer`, on the most common gesture in the app. The masthead save indicator had a smaller version of the same defect. The defect is independent of the motion pass and of the save-slot fix.

There were two unrelated causes. Each needed its own fix.

### The progress bar is out of flow

The progress bar is out of flow, not reserved a slot. Before the fix, it mounted between the header and the item rows on the first check-in. That was a 15px child appearing above everything it displaced.

It now sits on the card's own top edge. The element is `edgeBar`. It is absolutely positioned inside the card's existing `overflow: hidden` rounded box, so the 10px corner does its rounding. That is why `ProgressBar` has a `radius` prop separate from `height`. This keeps the bar from becoming a pill floating inside another shape. The bar catches no taps. It can mount and unmount without moving anything. It is 3px tall, because it is a rule on an edge now, not a bar in a row.

The bar is out of flow for a reason that is not about layout. It is what lets the `gotQty > 0 && !done` gate stand. A reserved slot would have to stay mounted through completion. The bar would then render at 100% and sheen. The gild in the motion design is the sole marker of a package completing, precisely because the bar cannot survive to be one. Test 44.5 fails if the gate goes. Read that failure as "this is a change to the motion design", not as a broken refactor.

The Tally card has `position: relative` for the same bar. PackageCard already had one for `.mdl-gild`. Without it, the bar escapes to the nearest positioned ancestor and draws somewhere else on the page entirely. That is why 44.2 and 44.7 pin both.

### The action row is reserved at its tallest state

The action row is reserved at its tallest state, `BULK_ROW_H`, which is 46px of content. Its membership changes on the same tap. "Clear check-ins" joins "Stamp" and "Mark all received". At 375px those three want 60.6 + 143.7 + 129.9 plus two 8px gaps. That is **350px in the 313px a card gives them**. Both bulk labels wrap to a second line, and the row goes from 31px to 46px. It shrinks by the same 15px on the tap that *completes* a package, where "Mark all received" leaves. Reserving the tallest state pins both transitions at once.

This is a counted constant, like the save slot's 13ch. It goes stale the same way: two lines of 11.5px mono plus `miniBtn`'s 8px padding.

The Tally card's row is deliberately not reserved. It has no Stamp button, so its two buttons are 282px of the same 313px. Neither wraps, so it is one line in every state. If a third control is added there, reserve it then. Measure rather than assume that 44px fits.

## Figures

Measured on the built page against the seeded ledger. The steps are rest, first check-in, second check-in, and the tap that completes the package. Across those steps, **card height is constant at 347.09px and every item row is displaced 0.00px**. Horizontal overflow is 0 in every state. The Tally card is likewise **496.09px constant, 0.00px shift**. Both figures were taken at the 44px reservation, before `BULK_ROW_H` became 46, and have not been re-measured.

Row content needed against the 46 reserved, by width: 57 at 320px, 46 at 360 / 375 / 390, 31 at 430 and 760.

At the 46px reservation, the first check-in moves no item row at 360, 375 or 390px: 0.00px.

## The 320px exception

**320px is the one width this does not fully fix.** Three buttons wrap to a *third* line there, and the row still steps 11px. The bar half is width-independent, so at 320px the shift falls from 28px to 11px. This is left deliberately. 320px is below the app's stated 380px floor. It is not a viewport that current iOS runs. Reserving 57px would fix 320px by spending 26px of dead space in every expanded card at the widths that are real.

If the fix is ever wanted, get it without dead space. Keep all three buttons mounted and hide the inapplicable one. The row then measures itself at every width. The cost is that the visible label wraps at rest. That is a look, so it is a decision for the owner, not a fix to apply.
