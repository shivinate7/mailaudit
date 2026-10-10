# Version-retention tiers are unioned, never intersected

Four independent reasons keep a saved version alive. They are recency, milestones, the earliest version of each hour, and the earliest version of each day. The hour and day anchors are derived at prune time, not stored. This keeps them from drifting out of step with the records they describe. The size of this tier lives in `ledger-and-seed-sizes`.

**Holds while:** `keptIds` in `src/version-rules.mjs` unions four tiers, and `RETENTION` sets `recentKeep` to 20, `milestoneDays` to 30, `hourHours` to 24 and `dayDays` to 180.

A pruning bug can delete the one version the user was reaching for. It leaves a list that still looks healthy. Nothing signals the loss until the moment it cannot be fixed.

## The module

`src/version-rules.mjs` decides which saved versions survive a prune. The four reasons are unioned and never intersected:

- The newest `recentKeep` versions.
- Milestones inside `milestoneDays`.
- The earliest record of each *hour* inside `hourHours`.
- The earliest record of each *day* inside `dayDays`.

## Why the hourly tier exists

The hourly tier closes a gap the other tiers leave. The ring holds ten to thirty minutes of dense work before it churns out. The day anchor holds this morning. Without the hourly tier, the answer to "put it back to how it was at 11am" would be "you cannot".

The hourly tier adds 24 more records, ~600KB gzipped. It is the cheapest tier here.

## Two deliberate choices

Two things are deliberate and easy to undo by accident.

- There is no stored "hourly" or "daily" kind, and nothing is ever promoted. Both anchors are derived at prune time by `earliestPer`. So they cannot drift out of step with the records, the way a written-once flag would.
- An anchor is its bucket's **earliest**. The state worth reaching for is how things stood *before* the stretch that went wrong.

`prunePlan` deletes every record that `keptIds` does not keep. So no record can be both kept and pruned. `shouldSnapshot` is the write gate. `entry.jsx` imports `prunePlan`, and `app.jsx` imports `shouldSnapshot`. Group 38.

## See also

- `versions-get-their-own-database` — the database these retention tiers prune
- `testing-one-tier-must-not-decide-another` — the testing pitfall this union design creates
