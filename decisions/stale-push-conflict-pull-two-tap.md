# A stale push merges, and it never overwrites

The app sends the sha it last saw for conflict checks. It never sends a sha fetched again right before the push. A stale push reports a conflict and changes nothing. On a device with a Worker key, the mirror push does not stop there. On a conflict it pulls the remote copy, merges that copy into the ledger, and writes under the sha the remote holds. Every push stays recoverable as a commit in history.

**Status:** the two-tap is gone. The owner ruled on 2026-10-12 that Pull, Push anyway, Push and Merge leave the UI. No control sends a pull or a force, so the two-tap that guarded a Pull has no subject. The stale-sha rule still holds, and the mirror path runs it on its own.

**Holds while:** `doPush` in `src/app.jsx` calls `remote.pull()`, merges the result, and calls `remote.push` with the fresh sha on a mirror conflict. `doPush` is called with `force` false at both of its call sites, so `pushForce` has no caller.

## Why the sha is the last one seen

Conflict detection uses the blob sha from the Contents API. The sha sent is the one this device last saw. A sha fetched again moments earlier would make every push win. It would silently discard the other device's work.

A stale push reports the conflict and changes nothing. Every push is a commit, so what it replaced is still in the branch's history. The pull inside a mirror conflict is a merge, not a replace. It keeps both devices' lines. It removes a line only for a later un-check (`merge-later-change-wins`).

## See also

- `sha-accepted-only-after-apply` — the rule that decides what counts as stale.
- `ledger-tab-holds-options` — the Sync group, which holds no Pull or Push.
- `pushforce-sha-only-after-write` — the force path, which no caller reaches now.
- `worker-keeps-snapshots` — the Worker that replaces the GitHub mirror.
- `merge-later-change-wins` — the merge rule that the mirror conflict runs.

**Retired:** tests 25.16 (a push over a remote this device never pulled conflicts), 26.14 (a push blocked as in group 25), 26.15 (the push after a pull is not blocked) and 34.1 (a blocked Push), on 2026-10-12 with the Push and Pull controls.

**Pinned by:** 54.3a (the stale write goes first, then one merged write under the sha the remote holds) and 54.3b (the merged write carries both devices). Groups 25, 26, 28 and 30 were re-pointed off the removed asks (commit `224a29e`). Test 54.3c asserts that no Push anyway is on screen. That is true by construction now, so it is not cited here.
