# The action row is ruled cells, not buttons

**Status:** ruled 2026-10-11, not built. Owner ruling, accept all: the 40px ruled row gets a 44px touch hit area, with no visual change. The web lane that builds it, L6 in the 2026-10-11 audit, is not briefed yet.

The action row holds equal ruled cells across the full width. The cells are Re-import CSV, History and Reset. They use uppercase mono, like the view switch. Each cell is 40px tall, like Find. Each cell has a 44px touch hit area, with no visual change.

**Holds while:** `src/app.jsx` styles the row as `.mdl-acts` with `grid-auto-flow: column`, and it has no Sync cell.

The head cells are label-over-value state. The action row is bare uppercase actions. That separation is kept by treatment, not by a different idiom. File management is not a filter. An earlier row used three boxed buttons pushed to the right edge. That tray used another visual idiom. It left a void near 450px at desktop width. A thin rule above the row divides it from the head cells.

The row is styled in the `<style>` tag as `.mdl-acts`, not as inline styles. Its membership depends on state. Re-import CSV shows only when the ledger or envelopes hold data. History shows when the versions adapter or the remote exists. So `grid-auto-flow: column` sets the columns.

Each cell draws its own right rule as the divider. The rule on the last cell is removed with `:last-child`. A prop cannot mark the last cell, as `headCell` does for its own cells.

The Sync cell is gone. Sync's entrance is the sync line, which appears when sync breaks or the panel is open. See `ruled-head-one-advisory-entrance`. History took the cell's place. History carries the only caret. The cell sets `aria-expanded` while it is open.

Re-import and Reset keep the narrower gate. See `recovery-control-not-state-gated`.

## See also

- `armed-reset-takes-the-row` — how an armed Reset takes the whole row.
- `ruled-head-masthead-vocabulary` — the head cells this row continues.
- `ruled-head-one-advisory-entrance` — the line that now opens the sync repair kit.
- `recovery-control-not-state-gated` — why Re-import and Reset keep their gate.
- `disclosure-cells-underline-value` — how a cell that opens a panel looks.
