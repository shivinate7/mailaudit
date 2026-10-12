# Test suite assertion count and run time

**Status:** re-measure blocked. At commit `12e8721` (L11b), `npm test` crashes at `test/app.test.mjs` line 137, in group 2, inside the `record()` helper. The error is `'set value' called on an object that is not a valid instance of HTMLInputElement`. The crash happens under the machine zone and under `TZ=UTC`, on a clean `npm ci`. No count is taken here. The 1031 and 1030 figures below predate L11b and are unverified on this commit. `check:docs` runs this suite first, so it fails before it checks any path or name.

This record holds the assertion count and the run time for `npm test`. The suite runs 1031 assertions and takes about 200 seconds. The earlier figure of 110 seconds is stale. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

The count depends on the clock's zone. Under UTC the suite runs 1030, because test 38.9 has nothing to claim there. So the zone is pinned to `America/New_York`. In CI, the test step sets `TZ`. Locally, `npm run check:docs` sets it for its own suite run. `check:docs` grades the figure in this sentence.

`npm test` has no test framework. It runs 1031 assertions in about 200s. Groups 30 to 31 spend a few seconds in real timers, on purpose. Groups 53 onward run on the harness virtual clock, see `harness-waits-past-debounces`. The sweep race can only be reached by letting the clock run. `test/app.test.mjs` runs top to bottom. It either prints "all green" or exits 1. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture's loader. The fixture itself is `shared/fixtures/ledger.json`.

The harness bundles `app.jsx` with esbuild. It sets `platform: "node"` and `format: "cjs"`. The bundle goes to `node_modules/.mailday-test/app.bundle.cjs`. jsdom is a devDependency, and the harness runs in it. The harness is committed on purpose. Three earlier harnesses were improvised and thrown away. The same assertions were rewritten from scratch each time. The app has no exports except the component. So every behaviour worth protecting is visible. The assertions read the DOM the way the user does.

## How to re-measure

Run `npm test` and read its own summary line for the assertion count. A passing run under New York time prints `1031 passed, 0 failed` and `all green`. Under UTC it prints `1030 passed, 0 failed`. Checked 2026-10-12 at commit 250823d: 206 seconds under the machine's zone (CDT), by verdict's timer. The UTC run took 194 seconds. Another UTC run shared the checkout for part of that time, so it reads high. The bare name `harness.mjs` refers to `test/harness.mjs`. Time the run with the shell's own timer. Expect a run near 200 seconds, because groups 30 to 31 hold real-timer waits on purpose.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.
