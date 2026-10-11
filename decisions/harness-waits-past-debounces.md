# Tests wait past the debounces

Two app timers settle after the next line of a test runs. The photo sweep runs on a 2-second timer. The ledger save is debounced by 500 ms. A test must wait past both timers. Otherwise it asserts on a state the app has not reached yet.

**Holds while:** `SWEEP_WAIT` is 2600 and `SAVE_WAIT` is 700 in `test/harness.mjs`, and the sweep timer in `src/app.jsx` is 2000 ms.

Use `SWEEP_WAIT` and `SAVE_WAIT`, not a literal delay. Each constant keeps a margin beyond its timer. Groups 30 and 31 spend a few seconds in real timers, on purpose. The sweep race can only be reached by letting the clock run.

Groups 53 to 56 run on a virtual clock instead. `installClock` in `test/harness.mjs` replaces `Date.now` and each `setTimeout` of 1 ms or more. Then `sleep` advances that clock and fires each timer that comes due. Those groups wait out the 10-second idle gate and the 3-second POST debounce. In real time they took up to 444 seconds, and a loaded machine made them fail. No code in `src/` knows about the clock.

## See also

- `photo-sweep-two-guards`, the sweep these waits cover.
- `suite-size`, the run time that real-timer groups add.
- `harness-drives-resume-by-event`, how tests avoid waiting for the 90-second debounce.
