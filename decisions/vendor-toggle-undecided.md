# The vendor toggle stays undecided

**Status:** open.

The app hard-filters imports to TCG vendor rows. Whether to add a toggle for eBay purchases is the user's call, not a default to guess. Guessing yes risks pulling in seller-side rows the checklist was never meant to hold. Guessing no keeps hiding orders the user may want tracked.

## The thread, as recorded

```
- Vendor toggle (include eBay purchases) — user undecided, currently hard-filtered to TCG.
```

## See also

- `parser-filters` — the current hard filter this toggle would change
- `imports-merge-never-replace` — the merge rule any newly included rows would flow through
