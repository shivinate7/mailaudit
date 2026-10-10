# Removing a stamp writes a tombstone

Removing an order stamp writes a tombstone value instead of deleting the entry. A hole cannot survive a merge the way a tombstone can. `useGkSet` gives the refunded and stamped sets an identity. That identity changes only when membership changes. So a note edit never rebuilds `packages` or refreezes the sort mid-check-in (`no-layout-shift-under-the-pointer`). Removal writes a tombstone, not a hole (`saved-state-shape`). Group 37 covers this.

**Holds while:** the remove path in `src/app.jsx` writes `kind: ""` instead of deleting the stamp, and `useGkSet` is defined there.

## See also

- `one-stamp-per-package` — the value this tombstone replaces.
- `merge-rules-only-add` — the merge rule a tombstone must still win against.
