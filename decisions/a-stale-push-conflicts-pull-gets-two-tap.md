# Pull gets the two-tap, push does not

The app sends the sha it last saw for conflict checks, never one fetched again right before the push. A stale push reports a conflict and changes nothing, and every push stays recoverable as a commit in history. A bad pull has no matching recovery. That is why only Pull carries the two-tap confirm, and Push does not.

## See also

- `sha-accepted-only-after-apply` — the rule that decides what counts as stale.
- `merge-carries-no-two-tap-arm` — the one confirm control that breaks this pattern on purpose.
- `pushforce-records-sha-only-after-write` — the force path this rule still guards.
