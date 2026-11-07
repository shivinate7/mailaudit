# A suite case fails under load and passes on a re-run

**What.** Case 49.C4 in `test/app.test.mjs` reads "Reset clears receivedAt, and the debounce does not write it back". It waits a real 800 ms past the 500 ms save debounce, with a literal `sleep(800)` (`harness-waits-past-debounces`).

- On 2026-11-07, `npm run check:docs` on `2750c16` printed "FAIL: 1 of 1678 failed", naming 49.C4. `uptime` read a 1-minute load of 20.03.
- The re-run on the same head passed, with a 1-minute load of 35.83. No file changed between the two runs.

**Harm.** `npm run check:docs` runs the suite (`suite-size`). A red check that a re-run clears teaches the reader to re-run it, not read it (claude-settings rule `verification-cry-wolf-guard-is-spent`).

If 49.C4 holds under load, the gap closes. Move it to the virtual clock, or widen its wait. Then a run at a high load must pass.

**Status:** open. The cause is unmeasured. The case has not been run in a loop under load.

**Decision:** `harness-waits-past-debounces`.
