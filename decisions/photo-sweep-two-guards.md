# The photo sweep has two guards

The photo sweep deletes blobs that no envelope references. Two guards stop it from deleting photos that a sync just downloaded. The first is `syncBusy` in the effect's condition. The second is `syncingRef.current` inside the timer callback. The two guards are redundant on purpose. The timer checks the sync ref again when it fires, because a pull writes blobs before the envelope list catches up.

**Holds while:** the sweep effect in `src/app.jsx` checks `syncBusy` before it arms its 2000 ms timer, and the timer callback checks `syncingRef.current` again.

Removing either guard alone leaves test 30.16 green. Removing both turns it red. The ref is set synchronously. The state behind `syncBusy` commits on React's schedule. jsdom does not reproduce that reliably. So no test pins either guard alone. Do not read a surviving single mutant as dead code.

Test 30.16 needs a slow download. `remote.photoDelay` makes a download slow. It is the only way to put the 2s sweep between two arriving photos.

## See also

- `photo-ids-restore-keep-if-known`, the restore rule that depends on the sweep.
- `photo-sync-cannot-conflict`, why photo sync needs no shared lock.
- `harness-waits-past-debounces`, how tests wait past the 2s sweep.
