# `max` on received cannot express an un-check

**Status:** open.

The merge takes the higher `received` count for each key, on purpose. Two devices never lose a check-in by racing. The same rule cannot express an un-check. "Clear check-ins", or stepping a qty back to 0, can lose to the other device's stale copy. Then the card comes back checked. This is visible, and one tap fixes it. The alternative is a per-key `receivedAt` schema change. That change is bought for a case that a phone-only check-in workflow rarely produces. The fix stays available. `receivedAt` would be an additive optional key, and `mergeReceived` is the one function to change.

**Holds while:** `mergeReceived` in `src/merge-rules.mjs` keeps the larger count for each key, and no code writes a `receivedAt` field. Adding that field closes this record.

## See also

- `merge-rules-only-add` — the design rule this gap is a known exception to
- `stamp-removal-writes-a-tombstone` — the pattern that would fix this if adopted
- `imports-merge-never-replace` — the wider merge philosophy this sits inside
