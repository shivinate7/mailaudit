# Push and merge guard on different confirms

The merge and the push refuse different in-progress states, and the difference is deliberate. The merge refuses while a compose, an undo, or any armed confirm is live. It applies a remote ledger, and that would erase in-progress work. The push refuses only on armed confirms, because it changes nothing on this device. A half-built envelope is not yet in the ledger, and a pending undo sits on top of a check-in that already happened and saved. Guarding the push on the same wider set stalled backup for an entire session in one real case.

## See also

- `auto-push-safe-because-merge-exists` — the merge these guards protect
- `two-device-merge-must-be-proven-first` — the proof this guarded merge needs before two devices sync
- `no-native-dialogs` — the confirm pattern these guards sit behind
