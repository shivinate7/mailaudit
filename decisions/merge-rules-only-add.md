# The two-device merge only ever adds

The merge module never drops a line, an item, or a received count. A merge that silently drops imported lines looks the same as one that worked, so the rule is that the merge only ever adds. This is why the merge needs no two-tap confirm, and why running it twice causes no harm. A removed stamp is the one exception. It travels as a tombstone and beats an older stamp, because a resurrected refund stamp would pull money back out of the tally.

## See also

- `b64-fails-by-producing-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `auto-push-safe-because-merge-exists` — why this rule is what makes auto-push safe
- `imports-merge-never-replace` — the invariant this module's union logic also serves
