# Pull gets the two-tap, push does not

The app sends the sha it last saw for conflict checks, never one fetched again right before the push. A stale push reports a conflict and changes nothing, and every push stays recoverable as a commit in history. A bad pull has no matching recovery. That is why only Pull carries the two-tap confirm, and Push does not.

## The argument, as recorded

```
  Conflict detection is the Contents API's blob sha, and the sha sent is the one
  *this device last saw* — never one re-fetched moments earlier, which would
  make every push win and silently discard the other device's. A stale push
  reports the conflict and changes nothing; `Push anyway` (two-tap) is the
  escape hatch, and it is safe-ish because every push is a commit, so what it
  overwrote is still in the branch's history. A bad *pull* has no such
  recovery — which is why Pull gets the two-tap and Push doesn't.
```
