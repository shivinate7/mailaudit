# The save indicator sits in a reserved, fixed-size slot

The save indicator used to grow and shrink with its own text. That change could add or remove a whole line in the tally footer on every check-in. The slot now reserves the width of its longest message. It also renders a non-breaking space when idle, because an empty flex item still collapses to zero height. The masthead-foot-slot record has the measured reservation and row heights.

## See also

- `masthead-foot-slot` — the measured slot width and row heights this reservation relies on.
- `no-layout-shift-under-the-pointer` — the invariant the reserved slot exists to satisfy.
- `card-the-action-row-is-reserved` — the same reservation pattern applied to a card's action row.
