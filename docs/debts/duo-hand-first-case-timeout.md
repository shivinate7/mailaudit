# A Duo UI wait times out in CI while its value is already right

**What.** In the `duo-ui` CI job, a 5 s `XCTNSPredicateExpectation` wait in `DuoHandUITests` can time out even though the label it waits for is already right. A UI query can also time out with "Failed to get matching snapshot". `testARefundStampedFromHandLeavesTally` runs first in the class, and its first check reads Tally before any Card in Hand step. Five runs show it. In two, the xcodebuild retry passed it after a first-try failure. In two, it passed on the first try. In one, it failed both tries:

- Run 42608659920, attempt 3, head b00a847 (no chip code): failed in 293.8 s on a snapshot timeout, then passed in 51.3 s.
- Run 42625642858, head 8e65045 (main's batch 31): passed on the first try in 146.4 s.
- Run 42631973452, head 54d49c8: failed in 31.1 s on the label wait (the label read "3 left · $3.00", which matches), then failed in 241.4 s on a snapshot timeout.
- Run 42643271925, head deee862: failed in 131.0 s on the label wait (the label matched), then passed in 49.3 s.
- Run 42666668781, head b59cff0 (batch 33): passed on the first try in 53.4 s. All 48 cases passed on the first try.

In run 42643271925, the new chip case `testChipClearsTheKeysAtAccessibilityXLWithTwoMatches` failed the same way. Its `assertChipSpeaks` wait at `DuoHandUITests.swift:565` timed out though the label matched (102.5 s in all). The retry passed in 48.6 s. In run 42666668781 it passed on the first try in 59.7 s. A run with a first-try failure is not a clean pass, and a debt retires only on a cited run whose pinning tests pass on the first try.

**Observed in run 42643271925 (job 129249675281).** The first test's first iteration and its retry ran in one xcodebuild process (pid 8596). On the retry, automation session setup took 5.55 s, not 26.65 s (4.8x). Wait-for-idle was 2.5x faster. The whole test took 49.3 s, not 131.0 s (2.7x). The 5 s label wait expired in the first iteration though the label read "3 left".

**Hypothesis, unmeasured.** The simulator's automation stack is cold on the first test. Both attempts share one xcodebuild process, so a cold start per process and one per simulator are not told apart.

**Fix under test.** The `duo-ui` job runs one short flat-pose test, `make ui-duo-warmup` (`DuoSpreadUITests/testFlatPackagesFullWidth`), between `pose flat` and the flat pass. It writes its own result bundle, tolerates failure, and no check reads it. The warm-up test also runs in the flat pass. It runs in its own xcodebuild, so whether it helps is open until the pull request runs show it. The gap closes when four runs in a row pass the cases above on the first try, each cited here.

**Status:** open. Found 2026-11-09 in lane `duo-held-chip`. Neither case is skipped or retried by hand. Closes when four consecutive runs pass the pinned cases on the first try (no run is cited yet since the warm-up).

**Decision:** `duo-ui-runs-on-pr-label`.
