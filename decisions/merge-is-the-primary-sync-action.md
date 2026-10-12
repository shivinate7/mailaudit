# Merge is the primary sync action

**Status:** retired 2026-10-12. The owner ruled that Pull, Push anyway, Push and Merge leave the UI. No control renders Merge or Push anyway now. The merge still runs on its own (`merge-carries-no-two-tap-arm`), so the reasons below still hold for that path.

The merge was the safe resolution, so it was the primary control. Its label read "Merge & push" on a conflict, and "Merge" otherwise. It appeared on a conflict, and when `peek()` said the other device was ahead.

Push anyway was the only force in the feature. It stayed advisory, in manila beside Merge. The force existed so that a device holding the copy worth keeping was not stuck behind a conflict. Every push is a commit, so what a force overwrote stayed in the branch's history. No code path passes a force now (`pushforce-sha-only-after-write`).

**Retired:** test 34.2 (the Merge & push button as the way out), on 2026-10-12.

**Holds while:** `src/app.jsx` renders no button labelled Merge, Merge & push or Push anyway. A control with one of those labels would undo this retirement.

## See also

- `merge-carries-no-two-tap-arm` — why the merge that runs on its own takes no two-tap arm.
- `stale-push-conflict-pull-two-tap` — the stale-push rule the mirror path still runs.
- `push-and-merge-guard-differently` — the guards on the automatic push and merge.
- `sync-panel-is-two-column-grid` — the grid these actions used to sit in.
