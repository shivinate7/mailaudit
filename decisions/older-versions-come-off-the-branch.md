# Older versions come from the branch

Every push creates a commit, so the remote branch already holds a full archive of past ledgers. `data` already was an archive. The missing part was a way to reach it without a laptop. Older versions come off the branch itself, behind a `Load older versions` tap. Nothing new is stored for them.

**Holds while:** `listVersions` and `getVersion` in `src/entry.jsx` read the `ledger.json` history on the `data` branch, and `mailaudit-data` is PRIVATE on GitHub.

`listVersions` and `getVersion` are both reads. They spend nothing from the 500-content-writes/hour budget. Both need the device key, because the data repository is private. Groups 39 and 41.

Restoring one funnels through the same `applyBackup`. It deliberately does not touch the stored sha. Rolling the ledger back is local. Pushing afterward rolls the remote back as a new commit, which keeps that reversible in turn.

## See also

- `milestones-are-taken-before-the-risk` — the local tiers this branch history extends.
- `sha-accepted-only-after-apply` — the sha rule a restore from here still follows.
