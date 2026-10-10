# ITP may clear storage after seven idle days

**Status:** open.

Apple's Intelligent Tracking Prevention (ITP) clears script-writable storage after 7 days of non-use. Home-screen-installed web apps are believed to be exempt. Nobody has confirmed this on a real device. The gap matters, because it is the difference between data that is safe and data that quietly vanishes. Confirm it empirically. Push and Pull make this survivable either way, as long as the user actually pushes.

## See also

- `every-origin-has-own-storage` — the storage this risk would clear
- `sync-runs-itself` — why an unattended push is the safety net here
- `nothing-recovers-without-the-key` — what a wiped device still needs to recover
