# The stored sha waits for the apply

The app stores the remote sha only after applying the pulled bytes, never the moment they arrive. The stored sha is this device's claim to already hold the remote data. Storing it earlier once let a failed apply leave a current sha over stale data. The next push then carried no conflict and silently overwrote the other device's work.

## See also

- `pushforce-records-sha-only-after-write` — the same rule reached through the force door.
- `a-stale-push-conflicts-pull-gets-two-tap` — the conflict this rule exists to raise honestly.
- `a-restore-is-not-local` — an operation that deliberately does not touch this sha.
