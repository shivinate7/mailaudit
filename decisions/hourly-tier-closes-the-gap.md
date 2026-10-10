# The hourly tier closes a gap

The ring keeps the newest 20 versions. That covers ten to thirty minutes of dense work before it churns out. The day anchor covers this morning. Neither covers the hour before that. The hourly tier keeps the earliest version of each hour for 24 hours. Without it, the answer to "put it back to how it was at 11am" would be "you cannot".

**Holds while:** `hourHours` is 24 in `RETENTION`, and `keptIds` in `src/version-rules.mjs` keeps `hourAnchors(today)`.

The source comment estimates 24 more records, roughly 600KB gzipped. It calls this the cheapest tier here. It also says this tier matches how a mail day actually goes wrong.

**Pinned by:** group 38, which is pure. Mutants confirmed red: the hourly tier deleted, the hourly tier reaching forever, and the hourly tier treating every record as an anchor.

## See also

- `retention-tiers-are-unioned` — the union this tier joins
- `anchor-is-the-earliest-record` — why the hourly anchor is the earliest of its hour
- `testing-isolate-each-tier` — why the day tier can hide a missing hourly tier
