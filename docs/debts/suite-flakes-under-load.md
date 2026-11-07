# Two suite cases fail under load and pass on a re-run

**What.** Two cases in `test/app.test.mjs` run on real timers and fail on a loaded machine. A re-run then passes. No code change sits between the two runs.

- 49.C4, "Reset clears receivedAt, and the debounce does not write it back". It failed twice, once with the 1-minute load near 20. Each re-run passed.
- 30.25, "a merge shows no lost tile". It failed once on duo's `c91a734` and once on the CI lint lane's `a2ee88f`, both on 2026-11-06. Each re-run passed.

**Harm.** `npm run check:docs` runs the suite, so a run with nothing wrong can still go red. A reader learns to re-run a red check instead of reading it. Then a real failure gets re-run away.

If both cases hold under load, the gap closes. Either move them to the virtual clock, or widen the wait that each one races. Then a run at a high load must pass.

**Status:** open. The cause of each failure is unmeasured. Neither case has been run in a loop under load.

**Decision:** `harness-waits-past-debounces`.
