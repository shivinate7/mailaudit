# Pull gets the two-tap, push does not

The app sends the sha it last saw for conflict checks. It never sends a sha fetched again right before the push. A stale push reports a conflict and changes nothing. Every push stays recoverable as a commit in history. A bad pull has no matching recovery. That is why only Pull carries the two-tap confirm, and Push does not.

**Holds while:** `confirmPull` in `src/app.jsx` arms the two-tap on Pull, and no `confirmPush` state exists for the Push button.

## Why the sha is the last one seen

Conflict detection uses the blob sha from the Contents API. The sha sent is the one this device last saw. A sha fetched again moments earlier would make every push win. It would silently discard the other device's work.

A stale push reports the conflict and changes nothing. `Push anyway` (two-tap) is the escape hatch. It is a partial safety net. Every push is a commit, so what it overwrote is still in the branch's history. A bad *pull* has no such recovery. That is why Pull gets the two-tap and Push does not.

## See also

- `sha-accepted-only-after-apply` — the rule that decides what counts as stale.
- `merge-carries-no-two-tap-arm` — the one confirm control that breaks this pattern on purpose.
- `pushforce-records-sha-only-after-write` — the force path this rule still guards.
