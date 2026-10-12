# A merge re-adopts the sync generation

`applyBackup` increments `syncGen`. It must, because a restore replaces the world that in-flight work was built on. So work that started before the apply must not finish after it. A merge pushes after its apply. Each generation-guarded step after that apply needs the new generation. Otherwise it silently does nothing.

**Holds while:** `doMerge` in `src/app.jsx` accepts exactly one `syncGen` bump from `applyBackup`, and test 34.29 in `test/app.test.mjs` uploads a photo that the merge adopts.

`doPull`, deleted in L11c, never noticed this. A pull ends with its apply, so the missing guard never mattered there. A merge pushes afterward. So the photo phase and the `Pushed ✓` flash silently did nothing. The flash is retired now. Only test 34.29 found it. It asserts that a photo the merge adopts is uploaded, not skipped.

## See also

- `sha-accepted-only-after-apply`, the sha rule that also waits for the apply.
- `a-restore-is-not-local`, the restore that bumps the generation.
- `two-device-merge-proven-first`, the merge this guard protects.
