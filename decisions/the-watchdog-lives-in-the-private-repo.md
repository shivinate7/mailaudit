# The backup watchdog lives in the private repo

**Status:** open.

The daily watchdog runs in `mailaudit-data`, not in the now-public `mailaudit`. GitHub disables scheduled workflows in a public repo after 60 days of inactivity. A watchdog that could silently switch itself off would reproduce the exact silent failure it exists to catch. Its cost is paid in Actions minutes on the private repo. It can therefore stop if that repo runs over its billing limit, and that failure has been verified directly. It is the only check that does not depend on the phone being honest about its own state.

## See also

- `backup-watchdog-catches-silent-failure` — the same alarm, argued from the app side
- `one-repo-for-both-halves` — the move that gave the watchdog its current home
- `ruled-head-the-staleness-clock-measures-agreement` — the phone-side signal this watchdog does not depend on
