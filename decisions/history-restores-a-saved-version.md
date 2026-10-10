# History lists saved versions and restores one

The History panel lists saved versions, newest first. Each row shows its time, its milestone and its counts.

**Holds while:** `src/app.jsx` loads the History list from `window.versions.list()`.

A row reads like `14:32 · before import · 806/481`. Expanding a row shows its delta against the ledger now. A two-tap `Restore this version` control restores that version.

The panel also carries Backup and Backup + photos. Those are version actions: save one off this device. They moved out of the Sync panel. The Sync panel is now a repair kit that opens only on failure.

A restore takes its own milestone on the way in. See `a-restore-is-not-local`.

## See also

- `versions-get-their-own-database` — where the saved versions live.
- `milestones-taken-before-risk` — when each version is taken.
- `a-restore-is-not-local` — what a restore does beyond this device.
- `older-versions-come-off-branch` — the older versions that the branch still holds.
- `backup-files-restore-two-ways` — the backup files that the panel also writes.
