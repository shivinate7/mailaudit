# The backup watchdog lives in the private repo

**Status:** open.

The daily watchdog runs in `mailaudit-data`, not in the public `mailaudit`. This placement is load-bearing. GitHub disables scheduled workflows in a public repo after 60 days of repository inactivity. Private repos are exempt.

Hosting the one device-independent backup alarm somewhere it can silently switch itself off would reproduce the exact failure it exists to catch. A workflow that never runs opens no issue. That looks the same as one that ran and found everything healthy.

The watchdog reads its own repo's `data` branch. It needs no cross-repo token and no edits.

Its cost is ~10s/day. That cost is paid in Actions minutes. So the watchdog stops entirely when the account is over its limit. This was verified directly. Right after the move, a dispatch with `threshold=0` was refused with the billing message, the same as the public repo's runs. The minutes hog is `test.yml`, which is free now that `mailaudit` is public. The watchdog's few minutes are not optional.

## The alarm has been seen to fire

The alarm has fired for real. From its old home in `mailaudit`, before the move, it was dispatched once with `threshold=0`. That opened issue #4, which is since verified and closed.

A green run only proves that the watchdog stayed quiet. The dispatch input exists so that the loud half can be proven too. Both sides of the comparison pass through `fromJSON`, because step outputs are strings. A string-to-number compare that silently reads false is exactly how an alarm ends up never going off.

## Why the phone cannot be the check

The whole reason this workflow exists is that the phone cannot check itself. The phone's "Backed up" line is only as honest as the phone. A device whose token expired, whose storage is unreadable, or that simply never gets opened has no way to tell you it stopped.

It is the only check that does not depend on the phone being honest about its own state. This watchdog cannot be fooled by anything happening on a device.

## See also

- `backup-watchdog-catches-silent-failure` — the same alarm, argued from the app side
- `one-repo-for-both-halves` — the move that gave the watchdog its current home
- `ruled-head-the-staleness-clock-measures-agreement` — the phone-side signal this watchdog does not depend on
