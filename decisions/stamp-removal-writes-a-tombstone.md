# Removing a stamp writes a tombstone

Removing an order stamp writes a tombstone value instead of deleting the entry. A hole cannot survive a merge the way a tombstone can. `useGkSet` gives the refunded and stamped sets an identity. That identity changes only when membership changes. So a note edit never rebuilds `packages` or refreezes the sort mid-check-in (invariant 5). Removal writes a tombstone, not a hole (invariant 2). Group 37 covers this.

## See also

- `one-stamp-per-package` — the value this tombstone replaces.
- `merge-rules-only-add` — the merge rule a tombstone must still win against.
