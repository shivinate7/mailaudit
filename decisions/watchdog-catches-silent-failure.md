# A scheduled watchdog checks the backup, not the phone

**Status:** retired. The owner ruled on 2026-10-14 that the backup watchdog is turned off, and the orchestrator disabled the workflow on 2026-10-16 at 03:12 CDT (id `356631798`). No check watches the backup now, see `backup-unwatched`.

The principle stands for any future alarm. A backup alarm must not depend on the phone being honest about its own state. The phone's "Backed up" line is only as honest as the phone. A device whose token expired, whose storage is unreadable, or that is never opened has no way to say it stopped.

The alarm was proven to fire once. A dispatch with `threshold=0` opened issue #4, which was verified and closed. A green run proves only that the alarm stayed quiet. Both sides of the comparison pass through `fromJSON`, because step outputs are strings. A string-to-number compare that silently reads false is how an alarm never goes off.

The sync advisory and the merge notice name no GitHub. See `ruled-head-one-advisory-entrance`.

**Holds while:** no alarm watches the backup. The watchdog workflow, `backup-watchdog.yml` in `mailaudit-data`, is off, see `backup-unwatched`.

Kind: process

Home: decisions/worker-keeps-snapshots.md

## See also

- `data-branch-setup` — the branch the retired watchdog read
- `one-repo-for-both-halves` — why an alarm would sit in the private repository
- `sync-runs-itself` — the sync the alarm was watching
