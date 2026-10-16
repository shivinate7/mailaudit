# The SWEEP_WAIT settle after 19.6 hides a stall at 30.13

**What.** The `SWEEP_WAIT` settle after 19.6 hides a stall at 30.13, and it does not explain it. Test 19.6 waits `SWEEP_WAIT` (2600 ms) before the next fresh start. The test's own comment says that wait stopped an intermittent stall at 30.13. Without it, 3 of 5 runs stalled. With it, 0 of 2 runs stalled. The cause of the stall is not known.

**Status:** open. Named limit from the sync switch, round 3. The cause is unmeasured.

**Decision:** `harness-waits-past-debounces`.
