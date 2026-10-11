# The later change wins in a two-device merge.

**Status:** accepted risk. A device clock set far ahead can pin a merge key.

A merge never drops a line from `items`. A check-in or an envelope goes only when a later write wins. A check-in count falls only that way. An un-check is one such write. A merge that silently dropped 35 imported lines would look the same as one that worked, so the rule matters. Running the merge again is harmless.

**Holds while:** `mergeReceived` in `src/merge-rules.mjs` takes the later time per key, and the per-key max when a time is missing. `mergeLedger` builds its result from named fields.

`src/merge-rules.mjs` reconciles two devices' ledgers. It is pure and directly tested. It is the piece that fails by producing a plausible wrong ledger.

- `mergeItems` unions by `it.key`. The CSV import path calls it too, so there is one definition of "union line items".
- `mergeReceived` takes the later time per key, from `receivedAt`. With no times, it takes the per-key **max**.
- `mergeEnvelopes` unions by id. The freshest `updatedAt` wins. A `deletedAt` tombstone competes the same way.
- `mergeStamps` works per package. The freshest `updatedAt` wins, and tombstones are included.
- `mergeLedger` and `mergeSummary` complete the module.

Removals are the exceptions. A removed stamp travels as a tombstone, and it beats an older stamp. An un-check and a discarded envelope win the same way, by time. Each is the user's own write winning by freshness. The merge does not decide anything here. The stamp tombstone exists because a resurrected `refunded` stamp would silently pull money back out of the tally.

`mergeLedger` builds the merged ledger from **named fields**. So a persisted key it does not name is dropped by every merge. It names `receivedAt`. The merge applies the result locally as a full replace, and then pushes it. That makes this file a sixth site for `saved-state-shape`, after the five sites in `app.jsx`.

**Pinned by:** groups 33, 34 and 49. Group 33 is pure, like groups 27 and 31. It imports `merge-rules.mjs` directly. A merge that dropped lines would make a plausible ledger, not an error. Its symmetry assertions are the ones to keep. Merging A into B and B into A must give the same counts. Merging twice must add nothing. Those two claims show that the merge does not prefer either device. They also show that a retry after a half-failed sync is harmless. Group 49 pins the un-check and tombstone merges.

Mutants confirmed red:
- `mergeReceived` using incoming-wins instead of `max`;
- `mergeItems` replacing instead of unioning;
- an envelope collision that prefers the bigger copy;
- `mergeLedger` letting the remote's view preferences win;
- assignment no longer stamping `updatedAt`.

## Clock skew is an accepted risk

A device clock set far ahead pins a key. A later real change on the other device then loses to that pinned time. Envelope and stamp `updatedAt` share this exposure. The merge trusts device time, and no bound checks it.

**Holds while:** `touchReceived` in `src/app.jsx` stamps `Date.now()` from the device, with no server time or skew bound. A server-set time, or a skew bound, would end this risk.

## See also

- `b64-fails-with-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `auto-push-safe-as-merge-exists` — why this rule is what makes auto-push safe
- `imports-merge-never-replace` — the invariant this module's union logic also serves
- `sync-revamp-cloudflare` — the design that added removals to this merge
