# The vendor toggle stays undecided

**Status:** open.

The app hard-filters imports to TCG vendor rows. The user has not decided whether to add a toggle that includes eBay purchases. That decision is the user's call, not a default to guess. Guessing yes risks pulling in seller-side rows that the checklist was never meant to hold. Guessing no keeps hiding orders the user may want tracked.

**Holds while:** `parseItems` in `src/app.jsx` drops a row whose non-blank Vendor does not start with `TCG`, with no toggle. An owner ruling on an eBay toggle closes this.

## See also

- `parser-filters` — the current hard filter this toggle would change
- `imports-merge-never-replace` — the merge rule any newly included rows would flow through
