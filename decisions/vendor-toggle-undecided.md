# The vendor toggle stays undecided

**Status:** open.

The app hard-filters imports to TCG vendor rows. The user has not decided whether to add a toggle that includes eBay purchases. That decision is the user's call, not a default to guess. Guessing yes risks pulling in seller-side rows that the checklist was never meant to hold. Guessing no keeps hiding orders the user may want tracked.

## See also

- `parser-filters` — the current hard filter this toggle would change
- `imports-merge-never-replace` — the merge rule any newly included rows would flow through
