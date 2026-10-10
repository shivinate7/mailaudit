# The order id link stops propagation

The order-id button in Tally stops its click from reaching the row underneath. The row checks a card in on any tap. Without the stop, a navigation tap would silently write to the ledger. That is the exact mis-tap that `no-layout-shift-under-pointer` exists to prevent.

**Holds while:** the order-id button in `ItemRow` in `src/app.jsx` calls `e.stopPropagation()` before it opens the order. The `onClick` of the row toggles a check-in.

The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would wipe the reveal on the very next commit.

`revealed` is ephemeral UI state, and it is never persisted. The five-site rule in `saved-state-shape` does not apply to it. Group 32 covers this.

**Pinned by:** group 32. Mutant confirmed red: the order-id button losing its `stopPropagation`. That turns a look into a check-in.

## See also

- `search-filters-inside-package` — the feature this control belongs to.
- `a-reveal-ignores-hidedone-too` — the reveal rule this button triggers.
