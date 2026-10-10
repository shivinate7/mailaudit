# A photo error never reaches pushState

The photo upload phase keeps its own status and its own error table. These are separate from the ledger's push state. The push state controls the only button that force-overwrites the ledger. The photo phase has its own state and its own copy table, `PHOTO_SAYS`. It must never write `pushState`. Only `pushState === "conflict"` gates **Push anyway**. GitHub answers 409 to rapid successive Contents writes on one repo. If a throttled photo error reached the ledger's error path, the app would offer a button that silently discards another device's check-ins. Test 30.11 covers this.

## See also

- `a-stale-push-conflicts-pull-gets-two-tap` — the button this rule protects from a false conflict.
- `photo-sync-cannot-conflict` — why a photo error is never a real conflict.
