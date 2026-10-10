# The card action row reserves its tallest height

The action row's buttons change on the same tap that changes the card. The row reserves the tallest height any combination of buttons can need. One width still shifts by a smaller amount. The card-reserved-geometry record has the exact heights per width. The app leaves that gap alone, because the width falls below its own stated floor.

## See also

- `card-reserved-geometry` — the measured card and action row heights this ruling reserves against.
- `no-layout-shift-under-the-pointer` — the invariant the reservation exists to satisfy.
- `card-the-bar-is-out-of-flow` — the other fix for the same 28 pixel shift, done a different way.
