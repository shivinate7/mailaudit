# sim-test runs simctl diagnose and can pick the Duo

**What.** After a failed UI test, `xcodebuild test` runs `simctl diagnose` on its own, for up to 600 s. Nobody reads what it collects. On 2026-10-28 that diagnose and the test run were the heaviest load on the machine, as the owner reported at 19:58 CDT. Also, `bin/sim-test` picks the first booted device with "iPhone" in its name, so a run meant for the iPhone 18 Pro can land on the iPhone Duo. The gap closes when `bin/sim-test` passes `-collect-test-diagnostics never` by default and picks its device by UDID, and when a test proves both.

**Status:** Fixed in claude-settings at 3cfebb9be (`-collect-test-diagnostics never` by default) and 13e511063 (device by role, UDID from `sim-lease`). `lint/test_sim_test.sh` pins both there and runs in its CI. This debt has no Retire line, so a delete waits on a `Retire-run` cite.

**Decision:** `one-simulator-per-mac`.
