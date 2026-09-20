# Test suite assertion count and run time

This record holds the assertion count and the run time for `npm test`. Re-measure whenever a test group is added or removed, or the suite's real-timer waits change.

## How to re-measure

Run `npm test` and read its own summary line for the assertion count. Time the run with the shell's own timer. Expect a run near 60 seconds, because groups 30 to 31 hold real-timer waits on purpose.

## Reader

`test/app.test.mjs` is the reader for the assertion count. It prints its own count and exits 1 on a failure. No reader checks the run time.

## The figures, as recorded

```
`npm test` — 541 assertions, no test framework, ~60s (groups 30–31 spend a few
seconds in real timers, deliberately: the sweep race can only be reached by
letting the clock run). `test/app.test.mjs` runs
top to bottom and either prints "all green" or exits 1; `test/harness.mjs` holds
the jsdom setup, storage mocks, DOM helpers and the fixture.
```
