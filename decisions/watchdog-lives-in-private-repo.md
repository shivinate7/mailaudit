# The backup watchdog lives in the private repo

**Status:** retired. The owner ruled on 2026-10-14 that the backup watchdog is turned off, so no alarm runs (`backup-unwatched`). The placement reasoning stays for any future alarm in this account, and the account-limit risk below applies to it.

For a future alarm: GitHub disables scheduled workflows in a public repo after 60 days of repository inactivity. Private repos are exempt. A watchdog stops entirely when the account is over its Actions limit. That was verified directly: right after the move, a dispatch with `threshold=0` was refused with the billing message, the same as the public repo's runs. Hosting an alarm where it can silently switch itself off reproduces the failure it exists to catch. A workflow that never runs opens no issue, which looks the same as one that ran and found everything healthy.

The watchdog read its own repo's `data` branch and needed no cross-repo token. Its cost was about 10 s a day, paid in Actions minutes. The minutes hog was `test.yml`, which is free now that `mailaudit` is public.

**Holds while:** any future alarm would sit in `mailaudit-data`, which is private. The watchdog there is off, see `backup-unwatched`.

Kind: process

Home: decisions/worker-keeps-snapshots.md

## See also

- `watchdog-catches-silent-failure` — the retired alarm, argued from the app side
- `one-repo-for-both-halves` — the move that gave the watchdog its home
- `ruled-head-stale-clock-agreement` — the phone-side signal the watchdog never depended on
