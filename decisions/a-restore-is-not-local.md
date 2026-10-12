# A restore is not local

Restoring a version rewrites `items`, `received` and `envelopes`. Three of these fields are deps of the auto-push debounce. So 90 seconds later, the rolled-back ledger publishes to the remote. It publishes unattended and is accepted. The stored sha is still current, so there is no conflict to raise.

**Holds while:** `AUTO_PUSH_MS` is 90000 in `src/app.jsx`, and the auto-push effect depends on `items`, `received` and `envelopes`.

Nothing is destroyed. Every push is a commit, and the other device recovers by merging. But the two-tap control said "replace everything", which reads as local. The control now says this out loud. When there is a key, the expanded row says "This becomes the backup too, a minute later".

A Reset has the same risk. `resetAll` keeps the sha by design. So a Reset publishes an empty ledger 90 seconds later. The risk is contained for the same reasons.

A restore takes its own `before restore` milestone on the way in. So tapping the wrong row is survivable, not a second disaster. The path every restore takes is in `every-restore-passes-applybackup`.

A restore does not touch the sha. Rolling the sha back would be the real mistake. It would 409 the next push against a remote that this device is not behind. That sends the next push into a conflict, which the automatic merge resolves. Merge unions line items and never drops one. So it would silently re-add the very lines the rollback removed. The repair path would undo the repair.

**Pinned by:** group 39. Mutant confirmed red: a restore that bypasses `applyBackup`. `parseLedger`, which `applyBackup` calls, validates the payload. Test 26.8 kills a mutant that removes the whole check. Test 35.1 kills a mutant that skips only the `mailday` check, because its payload carries `items` but no `mailday`. See `every-restore-passes-applybackup`.

## See also

- `sha-accepted-only-after-apply` — the sha rule a restore does not touch.
- `unwritable-store-says-so` — the version store a restore reads from.
- `milestones-taken-before-risk` — the safety net a restore takes on the way in.
