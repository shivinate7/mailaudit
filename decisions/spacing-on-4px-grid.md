# Spacing moves to a 4px grid with an 8px card radius

Spacing uses a 4px step. Every gap is a multiple of 4px. The card corner radius is 8px. The owner ruled on 2026-10-11: "Re-space to the grid."

**Status:** ruled 2026-10-11, not built. The code still uses off-grid values and a 10px card corner. A builder lane re-spaces it. That lane is not briefed yet.

**Holds while:** the house default in the claude-settings record `ux-house-rules` sets a 4px step and an 8px radius. A change to that default calls for a fresh look at this record.

## Re-measure after the change

The change moves the figures in two measurement records. Each record now says it needs a re-measure.

- `card-reserved-geometry` re-measures the card heights and the row shift.
- `ruled-head-heights` re-measures the control region at 375px.

Until then, neither record states a figure for the grid.

## See also

- `card-the-bar-is-out-of-flow` — the card corner that moves to 8px.
- `action-row-is-ruled-cells` — the 40px row, which is already a multiple of 4.
- `ux-house-rules-govern` — the house rule set this record follows.
