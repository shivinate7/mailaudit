# The card action row reserves its tallest height

The action row's buttons change on the same tap that changes the card. The row reserves the tallest height any combination of buttons can need. One width still shifts by a smaller amount. The card-reserved-geometry record has the exact heights per width. The app leaves that gap alone, because the width falls below its own stated floor.

**Holds while:** `BULK_ROW_H` in `src/app.jsx` is 46, and it reserves the tallest action-row state at 360px and up.

## Why the row reserves its tallest state

The row is reserved at its tallest state, `BULK_ROW_H`, which is 46px of content. Its membership changes on the same tap. "Clear check-ins" joins "Stamp" and "Mark all received". At 375px those three want 60.6 + 143.7 + 129.9 plus two 8px gaps. That is **350px in the 313px a card gives them**. Both bulk labels wrap to a second line, and the row goes from 31px to 46px. It shrinks by the same 15px on the tap that *completes* a package, where "Mark all received" leaves. Reserving the tallest state pins both transitions at once.

This is a counted constant, like the save slot's 13ch. It goes stale the same way: two lines of 11.5px mono plus `miniBtn`'s 8px padding.

The Tally card's row is deliberately not reserved. It has no Stamp button. Its two buttons are 282px of the same 313px. Neither wraps, so it is one line in every state. If a third control is added there, reserve it then. Measure rather than assume that 46px fits.

## Measurements

Measured on the built page against the seeded ledger. The steps are rest, first check-in, second check-in, and the tap that completes the package. Across those steps, **card height is constant at 347.09px and every item row is displaced 0.00px**. Horizontal overflow is 0 in every state. The Tally card is likewise **496.09px constant, 0.00px shift**. Both figures were taken at the 44px reservation, before `BULK_ROW_H` became 46, and have not been re-measured.

Row content needed against the 46 reserved, by width: 57 at 320px, 46 at 360 / 375 / 390, 31 at 430 and 760.

At the 46px reservation, the first check-in moves no item row at 360, 375 or 390px: 0.00px.

## The 320px exception

**320px is the one width this does not fully fix.** Three buttons wrap to a *third* line there, and the row still steps 11px. The bar half is width-independent, so at 320px the shift falls from 28px to 11px. This is left deliberately. 320px is below the app's stated 380px floor. It is not a viewport that current iOS runs. Reserving 57px would fix 320px by spending 26px of dead space in every expanded card at the widths that are real.

If the fix is ever wanted, get it without dead space. Keep all three buttons mounted and hide the inapplicable one. The row then measures itself at every width. The cost is that the visible label wraps at rest. That is a look, so it is a decision for the owner, not a fix to apply.

## See also

- `card-reserved-geometry` — the measured card and action row heights this ruling reserves against.
- `no-layout-shift-under-the-pointer` — the invariant the reservation exists to satisfy.
- `card-the-bar-is-out-of-flow` — the other fix for the same 28 pixel shift, done a different way.
