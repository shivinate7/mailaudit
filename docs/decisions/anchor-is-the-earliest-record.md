# An anchor is the earliest record of its bucket

Each hour and each day keeps its earliest version. The state worth reaching for is how things stood before the stretch that went wrong. The latest version of a bucket would keep the damage and drop the state the user wanted.

**Holds while:** `earliestPer` in `src/version-rules.mjs` keeps the record with the smaller `at` for each bucket key. The hour and day tiers share it.

**Pinned by:** group 38. Mutant confirmed red: the day anchor taking the day's latest version instead of its earliest.

## See also

- `anchors-are-derived-not-stored` — how the anchors are computed
- `hourly-tier-closes-the-gap` — the hourly anchor, and what it holds
- `milestones-taken-before-risk` — the other way to hold the state before a risk
