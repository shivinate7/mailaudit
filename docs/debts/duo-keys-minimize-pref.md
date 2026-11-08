# A simulator keyboard preference fails the Duo keys-up tests

**What.** The Duo keys-up tests in DuoHandUITests wait for the system keys and read their frame. When the simulator's keyboard preference `AutomaticMinimizationEnabled` (domain `com.apple.keyboard.preferences`) is true, the keys come up minimized, the frame is short, and the tests fail. On 2026-11-06 at 17:47 CST and 2026-11-07 at 13:02 CST, 7 of 21 DuoHandUITests failed this way on Duo 1. Nothing in the repo sets the preference. Only the lane's run scripts and the gatekeeper's reset write it false, so a fresh session meets the failure. The test's hint names only the hardware keyboard. The gap closes when the test setup or the run command sets the preference false before a Duo run, or the hint names it, and a fresh run passes.

**Status:** open. The hint at `requireKeysUp` now names the preference (2026-11-08); nothing sets it yet.

**Decision:** `duo-card-in-hand`.
