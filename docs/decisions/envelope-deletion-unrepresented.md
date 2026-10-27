# A discarded envelope leaves a tombstone that a stale copy cannot revive

**Status:** closed, by the `deletedAt` tombstone (`sync-revamp-cloudflare`).

**Holds while:** `mergeEnvelopes` in `src/merge-rules.mjs` keeps the copy with the later `updatedAt`, and a discard writes `deletedAt`.

A discard now leaves a tombstone. It sets `deletedAt`, and it empties `entries` and `photos`. Every envelope reader skips it. A merge keeps the later `updatedAt`, so a discard beats a stale copy. A newer live edit still beats the tombstone.

Discards now take the stamp bias, not the old resurrect bias. Entries are hand typed and exist nowhere else. A stale copy cannot bring a discard back. Stamps take the same bias, on purpose. A removed stamp is a tombstone, `kind: ""`. A resurrected `refunded` stamp would silently take money back out of the tally. A stamp is one value the user can re-set in two taps.

Tombstones and stamps orphaned by a changed seller string are never pruned. Both are a few bytes.

## See also

- `orphaned-mail-never-decides` — the invariant a stray envelope still obeys
- `stamp-removal-writes-a-tombstone` — the pattern a discard now follows
- `merge-later-change-wins` — the merge rule this record revised
