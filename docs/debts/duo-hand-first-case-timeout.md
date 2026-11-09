# A Duo UI wait times out in CI while its value is already right

**What.** In the `duo-ui` CI job, a 5 s `XCTNSPredicateExpectation` wait in `DuoHandUITests` can time out even though the label it waits for is already right. A UI query can also time out with "Failed to get matching snapshot". `testARefundStampedFromHandLeavesTally` runs first in the class, and its first check reads Tally before any Card in Hand step. The xcodebuild retry has passed it in three of four runs:

- Run 42608659920, attempt 3, head b00a847 (no chip code): failed in 293.8 s on a snapshot timeout, then passed in 51.3 s.
- Run 42625642858, head 8e65045 (main's batch 31): passed on the first try in 146.4 s.
- Run 42631973452, head 54d49c8: failed in 31.1 s on the label wait (the label read "3 left · $3.00", which matches), then failed in 241.4 s on a snapshot timeout.
- Run 42643271925, head deee862: failed in 131.0 s on the label wait (the label matched), then passed in 49.3 s.

In run 42643271925, the new chip case `testChipClearsTheKeysAtAccessibilityXLWithTwoMatches` failed the same way. Its `assertChipSpeaks` wait at `DuoHandUITests.swift:565` timed out though the label matched (102.5 s in all). The retry passed in 48.6 s. A run with a first-try failure is not a clean pass, and a debt retires only on a cited run whose pinning tests pass on the first try. The cause is unmeasured. A cold simulator was guessed and is not proven. The gap closes when the cause is found and four runs in a row pass these cases on the first try.

**Status:** open. Found 2026-11-09 in lane `duo-held-chip`. Neither case is skipped or retried by hand.

**Decision:** `duo-ui-runs-on-pr-label`.
