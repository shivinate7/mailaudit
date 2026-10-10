# The two-device merge only ever adds

The merge only ever adds. Nothing is dropped, and no count decreases. A merge that silently drops 35 imported lines looks the same as one that worked, so the rule matters. It is why the merge needs no two-tap confirm, and why running it again is harmless.

`src/merge-rules.mjs` reconciles two devices' ledgers. It is pure and directly tested. It is the piece that fails by producing a plausible wrong ledger.

- `mergeItems` unions by `it.key`. The CSV import path calls it too, so there is one definition of "union line items".
- `mergeReceived` takes the per-key **max**.
- `mergeEnvelopes` unions by id. The freshest `updatedAt` wins.
- `mergeStamps` works per package. The freshest `updatedAt` wins, and tombstones are included.
- `mergeLedger` and `mergeSummary` complete the module.

The one exception is a *removed* stamp. It travels as a tombstone and beats an older stamp. That is the user's own write winning by freshness. The merge does not decide anything here. The tombstone exists because a resurrected `refunded` stamp would silently pull money back out of the tally.

`mergeLedger` builds the merged ledger from **named fields**. So a persisted key it does not name is dropped by every merge. The merge applies the result locally as a full replace, and then pushes it. That makes this file a sixth site for invariant 2, after the five sites in `app.jsx`.

## See also

- `b64-fails-by-producing-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `auto-push-safe-because-merge-exists` — why this rule is what makes auto-push safe
- `imports-merge-never-replace` — the invariant this module's union logic also serves
