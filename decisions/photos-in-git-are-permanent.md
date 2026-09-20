# Photos in git are permanent

**Status:** open.

No path ever deletes a remote photo. Discard, the sweep, and Reset all stop at the device boundary, so a discarded envelope's label photo stays in the private repo forever. Adding a delete path is possible but costs a fourth content-generating request class and a new destructive control. The same permanence has an upside: Reset is survivable for photos, because a Pull brings both the ledger and the photos back.

## The thread, as recorded

```
- **Photos in git are permanent, including discarded ones.** Nothing ever
  deletes a remote photo: Discard, the sweep and `resetAll` all stop at the
  device boundary, and git history would keep the blob even if the tip didn't.
  So a label from an envelope you discarded stays in the private repo forever.
  A `DELETE` path is easy to add but costs a fourth content-generating request
  class and a new destructive control; being honest about it is the better
  trade. The upside of the same fact: **Reset is now survivable for photos** —
  `resetAll` keeps the token and sha, so a Pull brings ledger and photos back.
```

## See also

- `photo-sync-cannot-conflict` — the same one-file-per-photo design this permanence follows from
- `pushforce-records-sha-only-after-write` — the sha rule Reset relies on to stay recoverable
- `the-write-budget-is-shared` — the request budget a delete path would also spend
