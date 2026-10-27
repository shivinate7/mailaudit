# History lists saved versions and restores one

The History panel lists saved versions, newest first. Each row shows its time, its milestone and its counts.

**Holds while:** `src/app.jsx` loads the History list from `window.versions.list()`.

A row reads like `14:32 · before import · 806/481`. Expanding a row shows its delta against the ledger now. A two-tap `Restore this version` control restores that version. The arm reads "Tap again to replace N cards", where N is the ledger's cards. First focus goes to Cancel. The count is an orchestrator default of 2026-10-11, and it is built.

The panel also carries Backup and Backup + photos. Those are version actions: save one off this device. They moved out of the Sync panel. The Sync panel is now a repair kit that opens only on failure. The actions use `optGrid(2)`, as the Sync panel does. See `sync-panel-is-two-column-grid`.

A restore takes its own milestone on the way in. See `a-restore-is-not-local`.

**Status:** open. The count is the ledger's cards only. A restore also replaces the saved envelopes, since `applyBackup` replaces them wholesale, and their cards are not counted. Owner to rule whether the count includes them.

**Pinned by:** 36.5–36.7 pin this panel's own grid. Backup alone spans the row (36.5). Backup + photos adds a second cell (36.6). With two cells, each keeps its own half (36.7). Test 61.14 pins the restore count.

## See also

- `versions-get-their-own-database` — where the saved versions live.
- `milestones-taken-before-risk` — when each version is taken.
- `a-restore-is-not-local` — what a restore does beyond this device.
- `older-versions-come-off-branch` — the older versions that the branch still holds.
- `backup-files-restore-two-ways` — the backup files that the panel also writes.
