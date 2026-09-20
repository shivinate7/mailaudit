# The order-id link stops propagation

The order-id button in Tally stops its click from reaching the row underneath. The row itself checks a card in on any tap. Without the stop, tapping the link to navigate would silently write a check-in to the ledger.

## The argument, as recorded

```
  one handler and a `view` dep would wipe it on the very next commit. And the
  order-id button **stops propagation**: the row it sits in checks a card in on
  any tap, so without it a navigation gesture would silently write to the
  ledger — the exact mis-tap invariant 5 exists to prevent. `revealed` is
```
