# The two-device merge adds, and removals win by time

The merge never drops an item. A count can fall, but only when a later write wins the merge. An un-check is one such write. A merge that silently drops 35 imported lines looks the same as one that worked, so the rule matters. Running the merge again is harmless.

**Holds while:** `mergeReceived` in `src/merge-rules.mjs` takes the later time per key, and the per-key max when a time is missing. `mergeLedger` builds its result from named fields.

`src/merge-rules.mjs` reconciles two devices' ledgers. It is pure and directly tested. It is the piece that fails by producing a plausible wrong ledger.

- `mergeItems` unions by `it.key`. The CSV import path calls it too, so there is one definition of "union line items".
- `mergeReceived` takes the later time per key, from `receivedAt`. With no times, it takes the per-key **max**.
- `mergeEnvelopes` unions by id. The freshest `updatedAt` wins. A `deletedAt` tombstone competes the same way.
- `mergeStamps` works per package. The freshest `updatedAt` wins, and tombstones are included.
- `mergeLedger` and `mergeSummary` complete the module.

Removals are the exceptions. A removed stamp travels as a tombstone, and it beats an older stamp. An un-check and a discarded envelope win the same way, by time. Each is the user's own write winning by freshness. The merge does not decide anything here. The stamp tombstone exists because a resurrected `refunded` stamp would silently pull money back out of the tally.

`mergeLedger` builds the merged ledger from **named fields**. So a persisted key it does not name is dropped by every merge. It names `receivedAt`. The merge applies the result locally as a full replace, and then pushes it. That makes this file a sixth site for `saved-state-shape`, after the five sites in `app.jsx`.

**Pinned by:** groups 33, 34 and 49. Group 33 is pure, like groups 27 and 31. It imports `merge-rules.mjs` directly. A merge that drops lines makes a plausible ledger, not an error. Its symmetry assertions are the ones to keep. Merging A into B and B into A must give the same counts. Merging twice must add nothing. Those two claims show that the merge does not prefer either device. They also show that a retry after a half-failed sync is harmless. Group 49 pins the un-check and tombstone merges.

Mutants confirmed red:
- `mergeReceived` using incoming-wins instead of `max`;
- `mergeItems` replacing instead of unioning;
- an envelope collision that prefers the bigger copy;
- `mergeLedger` letting the remote's view preferences win;
- assignment no longer stamping `updatedAt`.

## See also

- `b64-fails-with-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `auto-push-safe-as-merge-exists` — why this rule is what makes auto-push safe
- `imports-merge-never-replace` — the invariant this module's union logic also serves
- `sync-revamp-cloudflare` — the design that added removals to this merge
