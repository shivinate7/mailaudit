# A scheduled watchdog checks the backup, not the phone

`backup-watchdog.yml` is the check the app cannot do for itself. It runs on a daily schedule. It reads the `data` branch's own history. If nothing has landed in four days, it opens an issue. So the watchdog cannot be fooled by anything that happens on a device.

**Holds while:** `backup-watchdog.yml` in `mailaudit-data` runs on a daily cron, defaults `threshold` to `'4'`, and applies `fromJSON` to both sides of the compare.

The alarm has been seen to fire. It was dispatched once with `threshold=0`, which opened issue #4. That issue was verified and closed. A green run proves only that the watchdog stayed quiet. The `threshold` input exists so the other half can be proven too.

Both sides of the comparison call `fromJSON` first. Step outputs are strings. A string/number compare that silently evaluates false is exactly how an alarm ends up never going off.

The phone's "Backed up" line is only as honest as the phone. A device whose token expired, whose storage is unreadable, or that simply never gets opened has no way to tell you it stopped.

## Orchestrator default 5, 2026-10-12

The user sees no GitHub state at all: no refused or expired token, no rate limit, no server error, no unknown peek. This watchdog is what catches a stopped mirror. It is an orchestrator default, not an owner ruling.

**Status:** built at f956873. The sync line, the advisory and the merge notice are silent. Tests 65.3, 65.6, 65.7, 37.69 and 40.13 pin this, and all pass at f956873. The unknown peek raises no line. `REMOTE_SAYS` (History) and `PHOTO_SAYS` (photos) name no GitHub. The word guard, `guardWords66`, reaches five sync states. See `ruled-head-one-advisory-entrance`.

## See also

- `data-branch-setup` — the branch the watchdog reads
- `one-repo-for-both-halves` — why the watchdog lives in the private repository
- `sync-runs-itself` — the automatic push the watchdog is checking on
