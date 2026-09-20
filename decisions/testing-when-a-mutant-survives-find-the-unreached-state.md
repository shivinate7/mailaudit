# When a mutant survives, find the unreached state

A surviving mutant means the fixtures never reach the state where the bug matters. The resume-merge suite passed every assertion while a signal-consumption bug lived on, because every fixture ended with both devices already in step. The fix was to build a fixture that stays out of step long enough to expose it.

## The argument, as recorded

```
- **One mutant survived the first draft of group 40, and finding out why is the
  lesson.** "The signal is never consumed" passed all fifteen assertions,
  because every one ended with the two ends *in step*, where no further merge is
  possible and a flag left standing costs nothing. The state nothing reached:
  `check()` re-runs on every `syncBusy` flip, not only on visibility, so an
  unconsumed flag lets the other device's push land mid-session with no resume
  in sight. 40.12–40.13 pin it. **When a mutant survives, look for the state
  your fixtures never reach.** (Relatedly, group 41's first draft matched the
  older commit by `message.split(" ")[0]` — every push message starts with
  `ledger`, so it selected the newest row and restored the version the app
  already had. It passed and proved nothing.)
```

## See also

- `testing-when-a-mutant-dies-check-the-cause` — the paired lesson, on a mutant that appears caught instead
- `sync-runs-itself` — the resume merge feature where this surviving mutant lived
