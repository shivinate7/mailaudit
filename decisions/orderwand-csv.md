# The OrderWand CSV schema and quirks

This file holds the CSV column list and every quirk found in the user's real OrderWand exports. Read it before touching the parser. No decision or invariant record owns this material, and the parser depends on every line of it.

## See also

- `parser-filters`, the invariant that keeps only TCG purchase rows.
- `imports-merge-never-replace`, why a re-import must not drop older orders.
- `saved-state-shape`, the item key built from these columns.
