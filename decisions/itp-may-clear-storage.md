# ITP may clear storage after seven idle days

**Status:** open.

Apple's Intelligent Tracking Prevention clears script-writable storage after seven days of non-use. Home-screen-installed web apps are believed to be exempt, but nobody has confirmed that on a real device. The gap matters: it is the difference between data that is safe and data that quietly vanishes. Push and Pull now make this survivable either way, as long as the user actually pushes.

## The thread, as recorded

```
- **Unverified on-device:** iOS clears script-writable storage after 7 days of
  non-use under ITP, but home-screen-installed web apps are understood to be
  exempt. Worth confirming empirically, since it's the difference between
  "safe" and "data quietly vanishes". (Push/Pull now makes this survivable
  either way, provided the user actually pushes.)
```

## See also

- `every-origin-has-own-storage` — the storage this risk would clear
- `sync-runs-itself` — why an unattended push is the safety net here
- `nothing-recovers-without-the-key` — what a wiped device still needs to recover
