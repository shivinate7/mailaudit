# Removing a stamp writes a tombstone

Removing an order stamp writes a tombstone value instead of deleting the entry. A hole cannot survive a merge the way a tombstone can. `useGkSet` gives the refunded and stamped sets an identity. That identity changes only when membership changes. So a note edit never rebuilds `packages` or refreezes the sort mid-check-in (`no-layout-shift-under-pointer`). Removal writes a tombstone, not a hole (`saved-state-shape`). Group 37 covers this.

**Holds while:** the remove path in `src/app.jsx` writes `kind: ""` instead of deleting the stamp, and `useGkSet` is defined there.

**Pinned by:** group 37. Mutants confirmed red:
- removal written as a `delete` rather than a tombstone (37.45);
- `mergeStamps` letting the incoming copy take a tie (37.55).

## See also

- `one-stamp-per-package` — the value this tombstone replaces.
- `merge-rules-only-add` — the merge rule a tombstone must still win against.
