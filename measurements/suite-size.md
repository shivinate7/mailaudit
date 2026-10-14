# Test suite assertion count and run time

**Status:** measured at `e641956`, checked 2026-10-14. The suite is green at this head. New York: 1318 passed, 0 failed, exit 0. UTC: 1317 passed, 0 failed, exit 0. Both runs finished under 140 s.

This record holds the assertion count and the run time for `npm test`. The suite runs 1318 assertions under New York time, and 1317 under UTC. Test 38.9 skips itself in UTC, so the UTC count is one lower. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

The count depends on the clock's zone, so the zone is pinned to `America/New_York`. In CI, the test step sets `TZ`, and it names one New York run's output in `CHECK_DOCS_SUITE_LOG`. `check:docs` grades the figure in this sentence. Locally, `npm run check:docs` runs the suite itself and waits for it to end.

`npm test` has no test framework. It runs `test/app.test.mjs` top to bottom. It prints `N passed, M failed`, and it exits 1 when M is not zero. Groups 30 to 31 spend a few seconds in real timers, on purpose. Groups 53 to 61 and 67 to 69 run on the harness virtual clock. Groups 62 to 66 and 70 keep real timers, see `harness-waits-past-debounces`. The sweep race can only be reached by letting the clock run. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture's loader. The fixture itself is `shared/fixtures/ledger.json`.

The harness bundles `app.jsx` with esbuild. It sets `platform: "node"` and `format: "cjs"`. The bundle goes to `node_modules/.mailday-test/app.bundle.cjs`. jsdom is a devDependency, and the harness runs in it. The harness is committed on purpose. Three earlier harnesses were improvised and thrown away. The same assertions were rewritten from scratch each time. The app has no exports except the component. So every behaviour worth protecting is visible. The assertions read the DOM the way the user does.

## How to re-measure

Run `npm test` and read its summary line. The count is passed plus failed. A green run prints `all green`. Time the run with the shell's own timer, or with `verdict`, which prints the elapsed seconds.

At `f956873`, the New York process printed its summary and `all green`, then stayed alive with no CPU use for 13 minutes. It was killed by hand. The UTC and machine-zone processes were stopped by hand just after their summaries. Their exit codes are unmeasured, and so is the cause.

Measured on 2026-10-14 at `e641956`, the merge of `web/tally-shift`, `web/merge-unknown-keys` and `web/weak-tests-68`. The count was 1312 at `b28e282`. It rose by 6 because groups 68 and 69 changed in `web/weak-tests-68`. Tests 68.9 and 68.10a were rewritten, and 69.3 was added. The 1-minute load was about 8 to 10 during the runs. The times may be inflated:

- New York zone (`TZ=America/New_York`): 1318 passed, 0 failed, exit 0. 126.9 s.
- UTC (`TZ=UTC`): 1317 passed, 0 failed, exit 0. 134.5 s.

At `b28e282`, the head of `web/merge-unknown-keys`: New York 1312 passed, 130.8 s. UTC 1311 passed, 135.5 s. Group 33 gained 33.31 to 33.50 since `75a96b8`.

At `75a96b8`, measured 2026-10-14 with a 1-minute load of about 3.3: New York 1292 passed, 125 s. UTC 1291 passed, 127 s. Group 33 gained 33.23 to 33.30 since `2857876`, which is the rise from 1284 to 1292. Group 70 is new since `db28eda`.

Before `75a96b8`, the 2026-10-12 run at `2857876` gave these figures. New York: 1284 passed, 169 s. UTC: 1283 passed, 178 s. The 1-minute load was about 92.

Each zone ran once, so each time is one reading. Groups 67 and 68 moved to the virtual clock at `c9e4c4f`, and the New York run went from 267.2 s to 123.9 s, back to back, under a 1-minute load of about 5 to 11. Their idle and retry waits had run in real time. Take several runs before you compare a time. Groups 30 to 31 hold real-timer waits on purpose.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.
