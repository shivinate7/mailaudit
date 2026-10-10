# Anchors are derived, not stored

No version carries a stored "hourly" or "daily" kind. Nothing promotes a version to an anchor. The hour and day anchors are computed at prune time. Both come from `earliestPer`, so they cannot drift out of step with the versions they describe. A flag written once would drift.

**Holds while:** `dayAnchors` and `hourAnchors` in `src/version-rules.mjs` both call `earliestPer`, and `keptIds` tests `kind` for `milestone` only.

The buckets are local calendar days and hours. `dayKey` and `hourKey` read the local getters, not UTC. That is on purpose. `at` is an instant, and no date string is parsed. The day tier reads only versions inside `dayDays`, so its anchors are bounded.

**Pinned by:** group 38. Mutants confirmed red: day anchors reaching forever, and `dayKey` reading UTC. Test 38.9 depends on the runner's zone. See `ci-runs-in-utc`.

## See also

- `anchor-is-the-earliest-record` — which version of each bucket is the anchor
- `ci-runs-in-utc` — why test 38.9 depends on the runner's zone
- `retention-tiers-are-unioned` — the union these anchors join
