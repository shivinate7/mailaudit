# When a mutant survives, find the unreached state

A surviving mutant shows that the fixtures never reach the state where the bug matters. An earlier draft of group 40 passed every assertion while a signal-consumption bug lived on. Every fixture in that draft ended with both devices already in step. The fix was a fixture that stays out of step long enough to expose the bug.

A fixture that ends with both ends in step cannot expose a signal left unconsumed. In step, no further merge is possible, so a flag left standing costs nothing. The mutant "the signal is never consumed" survived that draft. The state that nothing reached is this: `check()` re-runs on every `syncBusy` flip, not only on visibility. So an unconsumed flag lets the other device's push land mid-session, with no resume in sight. Tests 40.12 and 40.13 pin it.

Selecting a commit by `message.split(" ")[0]` picks the newest row. Every push message starts with `ledger`, so that selector restores the version the app already has. Group 41 first selected a commit this way, and its test passed while proving nothing.

When a mutant survives, look for the state your fixtures never reach.

## See also

- `testing-when-a-mutant-dies-check-the-cause` — the paired lesson, on a mutant that appears caught instead
- `sync-runs-itself` — the resume merge feature where this surviving mutant lived
