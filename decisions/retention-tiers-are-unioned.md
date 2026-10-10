# Retention tiers are unioned, never intersected

A saved version survives a prune when any one of four rules keeps it. The rules are these.

- The newest `recentKeep` versions.
- Milestones inside `milestoneDays`.
- The earliest version of each hour inside `hourHours`.
- The earliest version of each day inside `dayDays`.

No rule can cancel another. A version kept by one rule is kept. So the day anchor outliving the recent ring is the normal case.

**Holds while:** `keptIds` in `src/version-rules.mjs` unions four tiers. `RETENTION` sets `recentKeep` to 20 and `milestoneDays` to 30. It sets `milestoneMax` to 60, `hourHours` to 24 and `dayDays` to 180.

`milestoneMax` is a belt beside the braces. Thirty days of heavy imports must not outgrow the budget on their own.

`prunePlan` lists what `keptIds` does not keep. So no version can be both kept and pruned. `entry.jsx` imports `prunePlan`. `app.jsx` imports `shouldSnapshot`, the write gate that decides whether a change earns a version at all.

A pruning bug can delete the one version the user was reaching for. The list still looks healthy after it. Nothing shows the loss until it cannot be undone.

**Pinned by:** group 38, which imports `version-rules.mjs` directly. The group is pure, like groups 27, 31 and 33. Mutants confirmed red: the recent ring keeping everything, and every save earning a version.

## See also

- `hourly-tier-closes-the-gap` — the hourly tier, which this union joins
- `anchors-are-derived-not-stored` — how the hour and day anchors are computed
- `anchor-is-the-earliest-record` — which version of each bucket is kept
- `milestones-taken-before-risk` — the milestone tier, and the mutant that stops milestones surviving
- `versions-get-their-own-database` — the database these tiers prune
- `testing-isolate-each-tier` — the testing pitfall this union design creates
