# Pull gets the two-tap, push does not

The app sends the sha it last saw for conflict checks. It never sends a sha fetched again right before the push. A stale push reports a conflict and changes nothing. The automatic mirror push on a device with a Worker key does not stop there. On a conflict it pulls the remote, merges that copy into the ledger, and writes under the sha the remote holds. Every push stays recoverable as a commit in history. A bad pull has no matching recovery. That is why a Pull carries the two-tap confirm, and a Push does not.

**Status:** the UI asks are gone. The owner ruled on 2026-10-12 that Pull, Push anyway, Push and Merge leave the UI. Their asks and their count gaps no longer exist. The known gap is closed by removal, not by a count. The rule still holds for any Pull that a future lane adds.

**Holds while:** `confirmPull` in `src/app.jsx` is set only by `doPull`. No visible control calls `doPull`. `confirmForce` is set only by the dead `syncActions` array. In `doPush`, a mirror conflict runs `remote.pull()`, merges the result, and calls `remote.push` with the fresh sha. `pushForce` runs only when `doPush` gets `force`, and no visible control sends that.

## Why the sha is the last one seen

Conflict detection uses the blob sha from the Contents API. The sha sent is the one this device last saw. A sha fetched again moments earlier would make every push win. It would silently discard the other device's work.

A stale push reports the conflict and changes nothing. Every push is a commit, so what it replaced is still in the branch's history. A bad *pull* has no such recovery. That is why a Pull gets the two-tap and a Push does not.

## See also

- `sha-accepted-only-after-apply` — the rule that decides what counts as stale.
- `ledger-tab-holds-options` — the Sync group that now holds no Pull.
- `pushforce-sha-only-after-write` — the force path this rule still guards.
- `worker-keeps-snapshots` — the Worker that replaces the GitHub mirror.

**Pinned by:** 54.3a (the stale write goes first, then one merged write under the sha the remote holds), 54.3b (the merged write carries both devices), and 54.3c (no two-tap is armed). Groups 25 to 27 pinned the removed Pull and Push asks. They are for a builder to re-point.
