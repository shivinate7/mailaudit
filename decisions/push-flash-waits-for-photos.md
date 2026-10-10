# Pushed shows only after the photos

After a successful push, the button reads `Pushed ✓` for 2.5 seconds. The flash starts after the photo phase, not after the ledger leg. Showing it while a dozen uploads are queued would be a lie. It would also re-enable the button into a second, concurrent loop.

**Holds while:** `doPush` in `src/app.jsx` starts its 2500 ms flash timer after the photo phase, and both sync buttons are disabled on `syncBusy`.

A test that pushes twice must match `/^Push(ed ✓)?$/`. Both buttons stay disabled on `syncBusy` for the whole operation. They are not disabled on `pushState` or `pullState`. A successful push shows the flash, so `btn(/^Push$/)` does not match during it. It asserts on state, or it waits for the flash to end.

## See also

- `photo-errors-never-hit-pushstate`, the photo phase's own status.
- `two-device-merge-proven-first`, the merge that shares the flash.
- `merge-readopts-sync-generation`, the guard that lets the flash run after a merge.
