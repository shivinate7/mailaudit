# Older versions come from the branch

Every push has always created a commit, so the remote branch already held a full archive of past ledgers. Older versions load straight from that branch history instead of a new local store. Reading them costs nothing from the writes budget and needs no key on a public repo. Restoring one leaves the stored sha untouched, so pushing afterward creates a new, reversible commit.

## See also

- `milestones-are-taken-before-the-risk` — the local tiers this branch history extends.
- `sha-accepted-only-after-apply` — the sha rule a restore from here still follows.
