# Prove the two-device merge before trusting auto-push

Setting up sync ends with an actual conflict test, not a successful push. One device checks in a card and pushes. A second device, without pulling, imports new lines and pushes into the conflict, then merges. Both devices must end holding both sets of changes, and the first device's next merge must agree. There is no toggle to turn sync on, so this proof is required before running the app on two devices at all.

## See also

- `auto-push-safe-because-merge-exists` — why this proof matters before automatic sync runs
- `push-and-merge-guard-differently` — the guard rules this proof exercises
- `merge-rules-only-add` — the union rule this conflict test is proving
