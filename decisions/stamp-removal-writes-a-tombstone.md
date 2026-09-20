# Removing A Stamp Writes A Tombstone

Removing an order stamp writes a tombstone value instead of deleting the entry. A hole in the data cannot survive a merge the way a tombstone can. The refunded and stamped id sets keep a stable identity tied to membership. A note edit alone does not rebuild the package list or refreeze its sort order.

## The argument, as recorded

```
  nothing. `useGkSet` gives the refunded/stamped sets an identity that changes
  only with their *membership*, so a note edit never rebuilds `packages` and
  re-freezes the sort mid-check-in (invariant 5). Removal writes a tombstone,
  not a hole (invariant 2). Group 37.
```
