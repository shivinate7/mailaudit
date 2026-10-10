# Photos in git are permanent

**Status:** open.

No path ever deletes a remote photo. Discard, the sweep, and `resetAll` all stop at the device boundary. Git history would keep the blob even if the tip did not. So a label from an envelope you discarded stays in the private repo forever.

A `DELETE` path is easy to add. It costs a fourth content-generating request class and a new destructive control. Accepting the permanence is the better trade.

The same fact has an upside. Reset is survivable for photos. `resetAll` keeps the token and the sha, so a Pull brings the ledger and the photos back.

## See also

- `photo-sync-cannot-conflict` — the same one-file-per-photo design this permanence follows from
- `pushforce-records-sha-only-after-write` — the sha rule Reset relies on to stay recoverable
- `the-write-budget-is-shared` — the request budget a delete path would also spend
