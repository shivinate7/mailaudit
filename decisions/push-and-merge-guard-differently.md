# Push and merge guard on different confirms

The merge and the push refuse different in-progress states. The difference is deliberate. The push and the merge guard on different things, and the difference is the point.

**Status:** the Push and Merge controls left the UI on 2026-10-12. The guards below now apply to `autoPush` and `autoMerge`, which run on their own.

**Holds while:** `autoPush` in `src/app.jsx` does not check `composing` or `undo`, and `autoMerge` checks both. The held apply of a Worker reply checks the same `mergeBlocked` value as `autoMerge`.

The merge refuses while `composing`, `undo`, or any armed confirm is live. The merge applies a remote ledger. That would erase in-progress work. `applyBackup` nulls the first two flags. A Worker reply goes through the same merge, and it applies only after 10 s with no input. The Worker POST itself refuses nothing, because it changes nothing on this device.

The push refuses only on armed confirms. The push changes nothing on this device. A half-built envelope is not yet in the ledger. A pending undo sits on top of a check-in that really happened and is already saved.

Guarding the push on the same wider set was over-broad. It stalled backup for an entire session in one real case. `undo` survives a trip to Packages by design. Group 14 pins that. So an assignment followed by a view switch stopped all backup for the rest of the session. That was invisible. There is no undo control outside Orphaned. Test 38b.3b.

`composing` is also cleared when you leave Orphaned. The composer's draft lives in local state inside that view, and the draft is already gone by then. The flag outlived the thing it described.

## See also

- `auto-push-safe-as-merge-exists` — the merge these guards protect
- `two-device-merge-proven-first` — the proof this guarded merge needs before two devices sync
- `no-native-dialogs` — the confirm pattern these guards sit behind
