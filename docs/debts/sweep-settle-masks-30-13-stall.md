# The SWEEP_WAIT settle after 19.6 hides a stall at 30.13

**What.** The `SWEEP_WAIT` settle after 19.6 hides a stall at 30.13, and it does not explain it. Test 19.6 waits `SWEEP_WAIT` (2600 ms) before the next fresh start. The test's own comment says that wait stopped an intermittent stall at 30.13. Without it, 3 of 5 runs stalled. With it, 0 of 2 runs stalled. The cause of the stall is not known. On 2026-10-17 the stall did not reproduce: 0 of 6 local runs stalled without the settle, one with 2600 ms of in-process load. Unmount clears every app timer, and the photo mock is synchronous, so neither explains it. The settle stays, because a CI runner under load may still stall.

**Status:** open. Named limit from the sync switch, round 3. Not reproduced locally; the settle stays until a stall is seen again.

**Decision:** `harness-waits-past-debounces`.
