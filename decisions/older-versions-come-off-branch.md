# Older versions come from the branch

Every push creates a commit, so the remote branch already holds a full archive of past ledgers. `data` already was an archive. The missing part was a way to reach it without a laptop. Older versions come off the branch itself, behind a `Load older versions` tap. Nothing new is stored for them.

**Holds while:** `listVersions` and `getVersion` in `src/entry.jsx` read the `ledger.json` history on the `data` branch, and `mailaudit-data` is PRIVATE on GitHub.

`listVersions` and `getVersion` are both reads. They spend nothing from the 500-content-writes/hour budget. Both need the device key, because the data repository is private. Groups 39 and 41.

Restoring one is covered in `every-restore-passes-applybackup`. It deliberately does not touch the stored sha. The restore lands on this device first. Auto-push then publishes it as a new commit, about 90 seconds later, which keeps the rollback reversible. See `a-restore-is-not-local`.

`listVersions` reads `commits?path=ledger.json&sha=data`. That log is the version archive. Photo commits must stay off that log.

**Pinned by:** group 41, which reads older versions off the branch's own history. The remote mock records every push as a commit. That claim is the one this feature rests on. Mutant confirmed red: the load control fetching nothing. Group 41's first draft selected a commit by `message.split(" ")[0]`. Every push message starts with `ledger`. So that selector always picked the newest row. See `testing-surviving-mutant`.

## See also

- `milestones-taken-before-risk` — the local tiers this branch history extends.
- `sha-accepted-only-after-apply` — the sha rule a restore from here still follows.
