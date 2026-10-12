# Test suite assertion count and run time

**Status:** measured at `6b1c668`, checked 2026-10-12. The suite is red. 41 of its 1069 assertions fail, in groups 23, 28, 34, 36, 37 and 39, so `npm test` exits 1. The figures below count passed plus failed. They move when those groups are fixed.

This record holds the assertion count and the run time for `npm test`. The suite runs 1069 assertions under New York time, and 1068 under UTC. Test 38.9 skips itself in UTC, so the UTC count is one lower. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

The count depends on the clock's zone, so the zone is pinned to `America/New_York`. In CI, the test step sets `TZ`. Locally, `npm run check:docs` sets it for its own suite run. `check:docs` grades the figure in this sentence.

`npm test` has no test framework. It runs `test/app.test.mjs` top to bottom. It prints `N passed, M failed`, and it exits 1 when M is not zero. Groups 30 to 31 spend a few seconds in real timers, on purpose. Groups 53 onward run on the harness virtual clock, see `harness-waits-past-debounces`. The sweep race can only be reached by letting the clock run. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture's loader. The fixture itself is `shared/fixtures/ledger.json`.

The harness bundles `app.jsx` with esbuild. It sets `platform: "node"` and `format: "cjs"`. The bundle goes to `node_modules/.mailday-test/app.bundle.cjs`. jsdom is a devDependency, and the harness runs in it. The harness is committed on purpose. Three earlier harnesses were improvised and thrown away. The same assertions were rewritten from scratch each time. The app has no exports except the component. So every behaviour worth protecting is visible. The assertions read the DOM the way the user does.

## How to re-measure

Run `npm test` and read its summary line. The count is passed plus failed. A green run prints `all green` and exits 0. Time the run with the shell's own timer.

Measured at `6b1c668`:

- New York zone: 1028 passed, 41 failed. 134 s by verdict's timer. Exit 1.
- Machine zone (CDT): 1028 passed, 41 failed. 223 s by the shell's timer.
- UTC: 1027 passed, 41 failed. 167 s by the shell's timer.

The run time varies on this machine (134 s to 223 s at this commit), and the spread is not explained. Take several runs before you compare a time. Groups 30 to 31 hold real-timer waits on purpose, so a run near 200 seconds is normal.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.
