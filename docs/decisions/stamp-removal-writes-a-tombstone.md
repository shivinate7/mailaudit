# Removing a stamp writes a tombstone

Removing an order stamp writes a tombstone value instead of deleting the entry. A hole cannot survive a merge the way a tombstone can. `useGkSet` gives the refunded and stamped sets an identity. That identity changes only when membership changes. So a note edit never rebuilds `packages` or refreezes the sort mid-check-in (`no-layout-shift-under-pointer`). Removal writes a tombstone, not a hole (`saved-state-shape`). Group 37 covers this.

**Holds while:** `nextStamp` in `src/view-rules.mjs` returns the tombstone `{kind: "", note: "", at: "", updatedAt}` for a removal (V36.7) instead of deleting the stamp, native `LedgerStore.removeStamp` writes the same record, and `useGkSet` is defined in `src/app.jsx`.

**Pinned by:** group 37. Mutants confirmed red:
- removal written as a `delete` rather than a tombstone (37.45);
- `mergeStamps` letting the incoming copy take a tie (37.55).

## See also

- `one-stamp-per-package` — the value this tombstone replaces.
- `merge-later-change-wins` — the merge rule that lets a tombstone beat an older stamp.
