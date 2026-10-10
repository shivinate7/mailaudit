# Tests wait past the debounces

Two app timers settle after the next line of a test runs. The photo sweep runs on a 2-second timer. The ledger save is debounced by 500 ms. A test must wait past both timers. Otherwise it asserts on a state the app has not reached yet.

**Holds while:** `SWEEP_WAIT` is 2600 and `SAVE_WAIT` is 700 in `test/harness.mjs`, and the sweep timer in `src/app.jsx` is 2000 ms.

Use `SWEEP_WAIT` and `SAVE_WAIT`, not a literal delay. Each constant keeps a margin beyond its timer. Groups 30 and 31 spend a few seconds in real timers, on purpose. The sweep race can only be reached by letting the clock run.

## See also

- `photo-sweep-two-guards`, the sweep these waits cover.
- `suite-size`, the run time that real-timer groups add.
- `harness-drives-resume-by-event`, how tests avoid waiting for the 90-second debounce.
