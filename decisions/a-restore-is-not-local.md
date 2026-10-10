# A restore is not local

Restoring a version rewrites items, received counts, and envelopes, all fields the auto-push debounce watches. Ninety seconds later, the restored ledger publishes to the remote with nobody confirming that step. The two-tap restore control now says this out loud, because replace everything reads as local even though it is not. A Reset carries the identical risk, since it keeps the same sha and publishes an empty ledger the same way.

## See also

- `sha-accepted-only-after-apply` — the sha rule a restore does not touch.
- `a-store-that-cannot-write-says-so` — the version store a restore reads from.
- `milestones-are-taken-before-the-risk` — the safety net a restore takes on the way in.
