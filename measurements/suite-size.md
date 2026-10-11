# Test suite assertion count and run time

This record holds the assertion count and the run time for `npm test`. The suite runs 793 assertions and takes near 90 seconds. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

The count depends on the clock's zone. Under UTC the suite runs 792, because test 38.9 has nothing to claim there. So the zone is pinned to `America/New_York`. In CI, the test step sets `TZ`. Locally, `npm run check:docs` sets it for its own suite run. `check:docs` grades the figure in this sentence.

`npm test` has no test framework. It runs 793 assertions in ~90s. Groups 30 to 31 spend a few seconds in real timers, on purpose. Groups 53 to 56 run on the harness virtual clock, see `harness-waits-past-debounces`. The sweep race can only be reached by letting the clock run. `test/app.test.mjs` runs top to bottom. It either prints "all green" or exits 1. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture.

The harness bundles `app.jsx` with esbuild. It sets `platform: "node"` and `format: "cjs"`. The bundle goes to `node_modules/.mailday-test/app.bundle.cjs`. jsdom is a devDependency, and the harness runs in it. The harness is committed on purpose. Three earlier harnesses were improvised and thrown away. The same assertions were rewritten from scratch each time. The app has no exports except the component. So every behaviour worth protecting is visible. The assertions read the DOM the way the user does.

## How to re-measure

Run `npm test` and read its own summary line for the assertion count. A passing run prints `793 passed, 0 failed` and `all green`. Checked 2026-10-11 after a fresh `npm ci`. The bare name `harness.mjs` refers to `test/harness.mjs`. Time the run with the shell's own timer. Expect a run near 90 seconds, because groups 30 to 31 hold real-timer waits on purpose.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.
