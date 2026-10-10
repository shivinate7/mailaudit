# The order id link stops propagation

The order-id button in Tally stops its click from reaching the row underneath. The row checks a card in on any tap. Without the stop, a navigation tap would silently write to the ledger. That is the exact mis-tap that invariant 5 exists to prevent.

The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would wipe the reveal on the very next commit.

`revealed` is ephemeral UI state, and it is never persisted. Invariant 2's five-site rule does not apply to it. Group 32 covers this.

## See also

- `a-search-filters-inside-a-package` — the feature this control belongs to.
- `a-reveal-ignores-hidedone-too` — the reveal rule this button triggers.
