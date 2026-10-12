# Pull gets the two-tap, push does not

The app sends the sha it last saw for conflict checks. It never sends a sha fetched again right before the push. A stale manual push reports a conflict and changes nothing. The automatic mirror push on a device with a Worker key does not stop there. It writes once more under the sha the remote holds, through `pushForce`. Every push stays recoverable as a commit in history. A bad pull has no matching recovery. That is why only Pull carries the two-tap confirm, and Push does not.

**Holds while:** `confirmPull` in `src/app.jsx` arms the two-tap on Pull, and the Push button has no confirm state of its own.

**Status:** open. Pull's ask, "Tap again to replace", names no count and has no Cancel. The orchestrator default of 2026-10-11 says every ask names a true count. The house rule ux-ask-or-undo asks for first focus on Cancel too. Pull replaces the ledger and the saved envelopes, so its count would include both. Owner to rule the scope.

## Why the sha is the last one seen

Conflict detection uses the blob sha from the Contents API. The sha sent is the one this device last saw. A sha fetched again moments earlier would make every push win. It would silently discard the other device's work.

A stale manual push reports the conflict and changes nothing. `Push anyway` (two-tap) is the escape hatch for that push. It is a partial safety net. Every push is a commit, so what it overwrote is still in the branch's history. A bad *pull* has no such recovery. That is why Pull gets the two-tap and Push does not.

**Pinned by:** groups 25 to 27. Mutant confirmed red: a push that treats every failure as success. Group 54 pins the keyed mirror: test 54.3 forces the stale write, and test 54.3c arms no two-tap.

## See also

- `sha-accepted-only-after-apply` — the rule that decides what counts as stale.
- `merge-carries-no-two-tap-arm` — the one confirm control that breaks this pattern on purpose.
- `pushforce-sha-only-after-write` — the force path this rule still guards.
