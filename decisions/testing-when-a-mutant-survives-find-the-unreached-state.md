# When a mutant survives, find the unreached state

A surviving mutant means the fixtures never reach the state where the bug matters. The resume-merge suite passed every assertion while a signal-consumption bug lived on, because every fixture ended with both devices already in step. The fix was to build a fixture that stays out of step long enough to expose it.

## See also

- `testing-when-a-mutant-dies-check-the-cause` — the paired lesson, on a mutant that appears caught instead
- `sync-runs-itself` — the resume merge feature where this surviving mutant lived
