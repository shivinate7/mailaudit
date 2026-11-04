---
paths:
  - "src/version-rules.mjs"
  - "src/app.jsx"
  - "src/entry.jsx"
---

# Saved versions

## Saved versions and recovery

A milestone is taken before the risky step, never after. Read these before changing anything that restores.

- `milestones-taken-before-risk` — Milestones save before the risky step.
- `a-restore-is-not-local` — A restore is not local.
- `older-versions-come-off-branch` — Older versions come from the branch.
- `unwritable-store-says-so` — A broken version store must say so.
- `recovery-control-not-state-gated` — A recovery control cannot need the state it recovers.
- `retention-tiers-are-unioned` — Any one of four tiers keeps a version.
- `hourly-tier-closes-the-gap` — The hourly tier keeps one version per hour for a day.
- `anchors-are-derived-not-stored` — Hour and day anchors are computed at prune time.
- `anchor-is-the-earliest-record` — An anchor is the earliest version of its bucket.
- `history-restores-a-saved-version` — History lists saved versions and restores one.
- `backup-files-restore-two-ways` — Backup files restore with or without photos.
- `every-restore-passes-applybackup` — Every restore passes through applyBackup.
- `recent-checks-can-be-undone` — Ruled, not built: recent actions undone by tap (debt `recent-log-unbuilt`).

## Measurements

- `ledger-and-seed-sizes` — Ledger and version sizes.
