# The backup watchdog lives in the private repo

**Status:** open.

The daily watchdog runs in `mailaudit-data`, not in the now-public `mailaudit`. GitHub disables scheduled workflows in a public repo after 60 days of inactivity. A watchdog that could silently switch itself off would reproduce the exact silent failure it exists to catch. Its cost is paid in Actions minutes on the private repo. It can therefore stop if that repo runs over its billing limit, and that failure has been verified directly. It is the only check that does not depend on the phone being honest about its own state.

## The thread, as recorded

```
- **The backup watchdog lives in `mailaudit-data`, not in the public repo.**
  That placement is load-bearing. GitHub disables scheduled workflows in a
  **public** repo after 60 days of repository inactivity. Private repos are
  exempt. Hosting the one device-independent backup alarm somewhere it can
  silently switch itself off would reproduce the exact failure it exists to
  catch. A workflow that never runs opens no issue. That is indistinguishable
  from one that ran and found everything healthy. It reads its own repo's
  `data` branch, so it needs no cross-repo token and no edits. **Its cost is
  ~10s/day, but it is paid in Actions minutes**, so it stops entirely when the
  account is over its limit. Verified the hard way: dispatched with
  `threshold=0` right after the move, and refused with the billing message,
  same as the public repo's runs. The minutes hog is `test.yml`, which is free
  now that `mailaudit` is public. The watchdog's few minutes are not optional.
  **Its alarm has also been seen to fire for real**, from its old home in this
  repo before the move: dispatched once with `threshold=0`, it opened issue
  #4, since verified and closed. A green run only proves the watchdog stayed
  quiet. That dispatch input exists so the loud half can be proven too.
  Both sides of that comparison go through `fromJSON`, because step outputs
  are strings. A string-to-number compare that silently reads false is
  exactly how an alarm ends up never going off.
  **The whole reason this workflow exists is that the phone cannot check
  itself.** The phone's "Backed up" line is only as honest as the phone. A
  device whose token expired, whose storage is unreadable, or that simply
  never gets opened has no way to tell you it stopped.
  This one cannot be fooled by anything happening on a device.
```

## See also

- `backup-watchdog-catches-silent-failure` — the same alarm, argued from the app side
- `one-repo-for-both-halves` — the move that gave the watchdog its current home
- `ruled-head-the-staleness-clock-measures-agreement` — the phone-side signal this watchdog does not depend on
