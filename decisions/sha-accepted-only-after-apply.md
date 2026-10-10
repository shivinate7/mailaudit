# The stored sha waits for the apply

The app stores the remote sha only after it applies the pulled bytes. Storing the sha is this device's claim to hold the remote's bytes. The claim must be true when it is made, so the sha is stored last.

`pull()` returns the sha. `acceptPull()` stores it. The app calls `acceptPull()` after `applyBackup` has landed. This is the rule the whole conflict scheme rests on.

A sha stored on arrival lets a failed apply (a rejected payload, a merge that throws, or a generation guard that bails) leave a current sha over stale data. The next push then carries that sha and is accepted with no conflict, so the other device's work is destroyed. Auto-push makes this unattended, within 90 seconds.

## See also

- `pushforce-records-sha-only-after-write` — the same rule reached through the force door.
- `a-stale-push-conflicts-pull-gets-two-tap` — the conflict this rule exists to raise honestly.
- `a-restore-is-not-local` — an operation that deliberately does not touch this sha.
