# The two-device merge only ever adds

The merge module never drops a line, an item, or a received count. A merge that silently drops imported lines looks the same as one that worked, so the rule is that the merge only ever adds. This is why the merge needs no two-tap confirm, and why running it twice causes no harm. A removed stamp is the one exception. It travels as a tombstone and beats an older stamp, because a resurrected refund stamp would pull money back out of the tally.

## The argument, as recorded

```
- `src/merge-rules.mjs` — reconciling two devices' ledgers: `mergeItems` (union
  by `it.key`, and the CSV import path calls it too so there is one definition
  of "union line items"), `mergeReceived` (per-key **max**), `mergeEnvelopes`
  (union by id, freshest `updatedAt` wins), `mergeStamps` (per-package,
  freshest `updatedAt` wins, tombstones included) and
  `mergeLedger`/`mergeSummary`.
  Pure and directly tested for the sharpest version of the reason the three
  modules below are: this is the piece that fails by producing a *plausible
  wrong ledger*, and a merge that silently drops 35 imported lines is
  indistinguishable from one that worked. **The merge only ever ADDS** — nothing
  is dropped, no count decreases — which is why it needs no two-tap confirm and
  why re-running it is harmless. The one exception is a *removed* stamp, which
  travels as a tombstone and beats an older stamp: still the user's own write
  winning by freshness, not the merge deciding anything, and there because a
  resurrected `refunded` stamp would silently pull money back out of the tally.
  `mergeLedger` builds the merged ledger from **named fields**, so a persisted
  key it does not name is dropped by every merge, applied locally as a full
  replace, and pushed — invariant 2's five sites in `app.jsx` are this file's
  sixth.
```

## See also

- `b64-fails-by-producing-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `auto-push-safe-because-merge-exists` — why this rule is what makes auto-push safe
- `imports-merge-never-replace` — the invariant this module's union logic also serves
