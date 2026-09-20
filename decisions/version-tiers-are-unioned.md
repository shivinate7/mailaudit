# Version-retention tiers are unioned, never intersected

Four independent reasons keep a saved version alive: recency, milestones, the earliest of each hour, and the earliest of each day. A pruning bug that deletes the wrong version leaves a list that still looks healthy, with nothing to notice until the loss matters. The hour and day anchors are derived at prune time rather than stored. This keeps them from drifting out of step with the records they describe. See measurements/ledger-and-seed-sizes for the size of this tier.

## The argument, as recorded

```
- `src/version-rules.mjs` — which saved versions survive a prune. Same
  rationale as the modules around it: a pruning bug deletes the one version the
  user was reaching for and leaves a list that looks perfectly healthy, so there
  is nothing to notice until the moment it can't be fixed. Four independent
  reasons to live, **unioned and never intersected** — the newest `recentKeep`,
  milestones inside `milestoneDays`, the earliest record of each *hour* inside
  `hourHours`, and the earliest of each *day* inside `dayDays`. The hourly tier
  closes the gap the others leave: the ring holds ten to thirty minutes of dense
  work before it churns out and the day anchor holds this morning, so without it
  the honest answer to "put it back to how it was at 11am" was "you can't".
  24 more records, ~600KB gzipped — the cheapest tier here.
  Two things are deliberate and easy to undo by accident: there is **no stored
  "hourly" or "daily" kind and nothing is ever promoted** — both anchors are
  derived at prune time by `earliestPer`, so they cannot drift out of step with
  the records the way a written-once flag would; and an anchor is its bucket's
  **earliest**, because the state worth reaching for is how things stood
  *before* the stretch that went wrong. `prunePlan` is the complement of `keptIds`
  so no record can be both. `shouldSnapshot` is the write gate. Imported by
  `entry.jsx` (`prunePlan`) and `app.jsx` (`shouldSnapshot`). Group 38.
```
