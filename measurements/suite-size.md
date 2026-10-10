# Test suite assertion count and run time

This record holds the assertion count and the run time for `npm test`. The suite runs 541 assertions and takes near 60 seconds. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

The count depends on the clock's zone. Under UTC the suite runs 540, because test 38.9 has nothing to claim there. `npm run check:docs` pins a non-UTC zone for that reason, and it grades the figure in this sentence.

`npm test` has no test framework. It runs 541 assertions in ~60s. Groups 30 to 31 spend a few seconds in real timers, on purpose. The sweep race can only be reached by letting the clock run. `test/app.test.mjs` runs top to bottom. It either prints "all green" or exits 1. `test/harness.mjs` holds the jsdom setup, the storage mocks, the DOM helpers, and the fixture.

## How to re-measure

Run `npm test` and read its own summary line for the assertion count. Time the run with the shell's own timer. Expect a run near 60 seconds, because groups 30 to 31 hold real-timer waits on purpose.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.
