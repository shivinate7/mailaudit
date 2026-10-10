# The two-device merge only ever adds

The merge only ever adds. Nothing is dropped, and no count decreases. A merge that silently drops 35 imported lines looks the same as one that worked, so the rule matters. It is why the merge needs no two-tap confirm, and why running it again is harmless.

**Holds while:** `mergeReceived` in `src/merge-rules.mjs` keeps the larger count for each key. `mergeLedger` builds its result from named fields.

`src/merge-rules.mjs` reconciles two devices' ledgers. It is pure and directly tested. It is the piece that fails by producing a plausible wrong ledger.

- `mergeItems` unions by `it.key`. The CSV import path calls it too, so there is one definition of "union line items".
- `mergeReceived` takes the per-key **max**.
- `mergeEnvelopes` unions by id. The freshest `updatedAt` wins.
- `mergeStamps` works per package. The freshest `updatedAt` wins, and tombstones are included.
- `mergeLedger` and `mergeSummary` complete the module.

The one exception is a *removed* stamp. It travels as a tombstone and beats an older stamp. That is the user's own write winning by freshness. The merge does not decide anything here. The tombstone exists because a resurrected `refunded` stamp would silently pull money back out of the tally.

`mergeLedger` builds the merged ledger from **named fields**. So a persisted key it does not name is dropped by every merge. The merge applies the result locally as a full replace, and then pushes it. That makes this file a sixth site for `saved-state-shape`, after the five sites in `app.jsx`.

**Pinned by:** groups 33 and 34. Group 33 is pure, like groups 27 and 31. It imports `merge-rules.mjs` directly. A merge that drops lines makes a plausible ledger, not an error. Its symmetry assertions are the ones to keep. Merging A into B and B into A must give the same counts. Merging twice must add nothing. Those two claims show that the merge cannot pick a loser. They also show that a retry after a half-failed sync is harmless.

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
