# A restore is not local

Restoring a version rewrites `items`, `received` and `envelopes`. The sync POST in `src/app.jsx` sends the ledger to the Worker `SYNC_POST_MS` (3 s) after a change. So a restore reaches the Worker about 3 seconds later, unattended. The Worker keeps daily snapshots, and a restore takes its own `before restore` milestone on the way in.

**Holds while:** `SYNC_POST_MS` is 3000 in `src/sync-rules.mjs`. The sync POST effect in `src/app.jsx` sends after a change. `applyBackup` in `src/app.jsx` calls `restampRestore` when it replaces the ledger.

A restore is a change the person made now. `restampRestore` (in `src/merge-rules.mjs`) gives the restore time to every check-in key and stamp that either ledger holds. It also gives that time to every envelope the restore carries. An envelope the restore drops becomes a tombstone at that time. So a later Worker reply, older than the restore, cannot undo it, even for a key this device never held.

The two-tap control said "replace everything", which reads as local. The control copy that named the backup is no longer in `src/app.jsx`. Its current wording is unmeasured.

A Reset takes the same path to the Worker. Its effect on the Worker's copy is unmeasured.

The stored sha was a GitHub rule. A restore never touched it, and that rule left with the mirror.

**Pinned by:** group 39, test 50.B4 (a restore into an empty device stamps the time it lands), and group 72 (a later reply cannot undo a restore). Mutant confirmed red: a restore that bypasses `applyBackup`. `parseLedger`, which `applyBackup` calls, validates the payload. Test 35.1 kills a mutant that skips only the `mailday` check, because its payload carries `items` but no `mailday`. See `every-restore-passes-applybackup`.

**Retired:** test 26.8 killed a mutant that removes the whole `parseLedger` check. It left with the Pull control on 2026-10-12. The whole-check mutant has no named pin now.

Kind: build

Plan: docs/decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `unwritable-store-says-so` — the version store a restore reads from.
- `milestones-taken-before-risk` — the safety net a restore takes on the way in.
