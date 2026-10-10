# What each view and control does

This file holds the Feature map. It describes the three views, saved
versions and stamps, and how Push, Pull and the sync panel behave. Read it
when you need to know what a screen or control does, not why it was built
that way. The rulings behind these features live in other decisions/ files
and in invariants/. This file is description only.

## See also

- `card-tally-row-counts-first` — why the Tally row orders its meta line the way it does.
- `unit-rate-is-not-the-position` — the figure the Tally sort calls "unit rate".
- `cost-basis-excludes-shipping-and-tax` — what basis counts and what it leaves out.
- `orphaned-mail-never-decides` — the invariant Orphaned's ranking must never cross.
- `stamp-removal-writes-a-tombstone` — how a removed stamp survives a merge.
- `one-stamp-per-package` — why picking a new stamp kind replaces, not stacks.
- `versions-get-their-own-database` — why saved versions live outside the photo store.
- `milestones-are-taken-before-the-risk` — when a milestone version is taken.
- `sha-accepted-only-after-apply` — the rule the sync panel's Push/Pull rest on.
- `peek-is-three-valued` — what peek() answers and why unknown is not clear.
- `one-repo-for-both-halves` — why the ledger and photos share one repo now.
- `photo-sync-cannot-conflict` — why photo sync needs no sha at all.
