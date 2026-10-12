# Pushed shows only after the photos

**Status:** retired 2026-10-12. The owner removed the Push controls from the UI. No render shows a Pushed flash now, and test 64.4 asserts that no Pushed ✓ is on screen.

The flash used to start after the photo phase, not after the ledger leg. Showing it while a dozen uploads were queued would have been a lie. The sync flag stayed set for the whole operation, so a second tap could not start a concurrent loop.

**Holds while:** `doPush` in `src/app.jsx` still sets `setPushState("idle")` 2500 ms after the photo phase, and no render shows a "Pushed" label. Showing one again would undo this retirement.

## See also

- `two-device-merge-proven-first` — the two-device proof that used to end on this flash.
- `merge-readopts-sync-generation` — the generation guard the flash depended on.
