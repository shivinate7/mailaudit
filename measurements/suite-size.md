# Test suite assertion count and run time

**Status:** measured at `9af0539`, checked 2026-10-12. All 1086 assertions pass under New York time, and all 1085 pass under UTC. Both runs exit 0 by themselves, with no live handles left.

This record holds the assertion count and the run time for `npm test`. The suite runs 1086 assertions under New York time, and 1085 under UTC. Test 38.9 skips itself in UTC, so the UTC count is one lower. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

The count depends on the clock's zone, so the zone is pinned to `America/New_York`. In CI, the test step sets `TZ`, and it names one New York run's output in `CHECK_DOCS_SUITE_LOG`. `check:docs` grades the figure in this sentence. Locally, `npm run check:docs` runs the suite itself and waits for it to end.

`npm test` has no test framework. It runs `test/app.test.mjs` top to bottom. It prints `N passed, M failed`, and it exits 1 when M is not zero. Groups 30 to 31 spend a few seconds in real timers, on purpose. Groups 53 onward run on the harness virtual clock, see `harness-waits-past-debounces`. The sweep race can only be reached by letting the clock run. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture's loader. The fixture itself is `shared/fixtures/ledger.json`.

The harness bundles `app.jsx` with esbuild. It sets `platform: "node"` and `format: "cjs"`. The bundle goes to `node_modules/.mailday-test/app.bundle.cjs`. jsdom is a devDependency, and the harness runs in it. The harness is committed on purpose. Three earlier harnesses were improvised and thrown away. The same assertions were rewritten from scratch each time. The app has no exports except the component. So every behaviour worth protecting is visible. The assertions read the DOM the way the user does.

## How to re-measure

Run `npm test` and read its summary line. The count is passed plus failed. A green run prints `all green`. Time the run with the shell's own timer.

At `f956873`, the New York process printed its summary and `all green`, then stayed alive with no CPU use for 13 minutes. It was killed by hand. The UTC and machine-zone processes were stopped by hand just after their summaries. Their exit codes are unmeasured, and so is the cause.

Measured at `f956873`, 2026-10-12:

- New York zone (`TZ=America/New_York`): 1079 passed, 0 failed. About 2 min from the verdict log's first line to its last output.
- UTC (`TZ=UTC`): 1078 passed, 0 failed. About 2 min by the same measure.
- Machine zone (CDT, plain `npm test`): 1079 passed, 0 failed. About 2 min by the same measure.

The run time varies on this machine. Take several runs before you compare a time. Groups 30 to 31 hold real-timer waits on purpose.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.
