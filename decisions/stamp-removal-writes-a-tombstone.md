# Removing a stamp writes a tombstone

Removing an order stamp writes a tombstone value instead of deleting the entry. A hole in the data cannot survive a merge the way a tombstone can. The refunded and stamped id sets keep a stable identity tied to membership. A note edit alone does not rebuild the package list or refreeze its sort order.

## See also

- `one-stamp-per-package` — the value this tombstone replaces.
- `merge-rules-only-add` — the merge rule a tombstone must still win against.
