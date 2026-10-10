# Photo writes wait one second after the ledger

`push()` waits on `spaceWrites()` before the photo uploads start. The keyword `await` must stay before that call. The wait is one second, the same clock that `pushPhoto` uses.

**Holds while:** `push()` in `src/entry.jsx` calls `await spaceWrites()`, and `pushPhoto` uses the same clock.

Before the merge, the ledger PUT could skip this wait. It was the only write its repo ever saw. Now `app.jsx` pushes the ledger, then loops over the photo uploads at once.

Remove the wait, and the first photo of every push 409s. So the call must stay.

Keep the error tables separate too. A throttled photo must never reach `pushState`. See `photo-errors-never-hit-pushstate`.

## See also

- `ledger-and-photos-share-a-repo` — the shared repo that makes the 409 possible.
- `photo-errors-never-hit-pushstate` — why a throttled photo never looks like a conflict.
- `the-write-budget-is-shared` — the write budget the ledger and photos share.
- `photo-sync-cannot-conflict` — why a photo write needs no sha.
