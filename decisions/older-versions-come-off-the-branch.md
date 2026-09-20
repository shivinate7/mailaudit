# Older versions come from the branch

Every push has always created a commit, so the remote branch already held a full archive of past ledgers. Older versions load straight from that branch history instead of a new local store. Reading them costs nothing from the writes budget and needs no key on a public repo. Restoring one leaves the stored sha untouched, so pushing afterward creates a new, reversible commit.

## The argument, as recorded

```
  **Older versions come off the branch itself**, behind a `Load older versions`
  tap. Nothing new is stored for it: every push has always been a commit, so
  `data` already *was* an archive — the missing half was reaching it without a
  laptop. `listVersions`/`getVersion` are both **reads**, so they spend nothing
  from the 500-content-writes/hour budget and neither needs a key on the public
  repo. Restoring one funnels through the same `applyBackup`, and deliberately
  does not touch the stored sha: rolling the ledger back is local, and pushing
  afterwards rolls the remote back as a *new* commit, which keeps that
  reversible in turn. Groups 39 and 41.
```
