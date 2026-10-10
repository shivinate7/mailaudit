# Merge is the primary sync action

Merge is the primary sync action. Push anyway stays advisory.

**Holds while:** `src/app.jsx` sets `on: true` on the Merge action, and it styles the Push anyway action in manila.

Merge appears on a conflict. It also appears when `peek()` says the other device is ahead. It covers the case that the automatic path could not finish.

Merge is filled accent violet. That is the app's colour for the live control. Merge is the safe resolution, so it is the primary one. Its label reads "Merge & push" on a conflict. Otherwise it reads "Merge".

Push anyway sits beside Merge, in advisory manila. It takes a two-tap arm. It is the only force in the feature.

The force exists so that a device holding the copy worth keeping is not stuck behind a conflict. Every push is a commit. So what the force overwrites stays in the branch's history.

## See also

- `merge-carries-no-two-tap-arm` — why Merge takes no two-tap arm.
- `stale-push-conflict-pull-two-tap` — why Pull takes a two-tap arm, and Push does not.
- `push-and-merge-guard-differently` — the states that Push and Merge each refuse.
- `sync-panel-is-two-column-grid` — the grid these actions sit in.
