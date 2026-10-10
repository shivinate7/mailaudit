# Version-retention tiers are unioned, never intersected

Four independent reasons keep a saved version alive: recency, milestones, the earliest of each hour, and the earliest of each day. A pruning bug that deletes the wrong version leaves a list that still looks healthy, with nothing to notice until the loss matters. The hour and day anchors are derived at prune time rather than stored. This keeps them from drifting out of step with the records they describe. The size of this tier lives in `ledger-and-seed-sizes`.

## See also

- `versions-get-their-own-database` — the database these retention tiers prune
- `testing-one-tier-must-not-decide-another` — the testing pitfall this union design creates
