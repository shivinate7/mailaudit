# Drive a resume by event, not by waiting

Tests drive auto-push and the resume by dispatching events. No test waits out the 90-second debounce. `background()` dispatches `visibilitychange` with `visibilityState` stubbed to `hidden`. The `autoPush()` handler then runs at once. That is a fast seam, and also a real path. Switching away mid-session is the last chance to catch a session that never went idle. `foreground()` is the inverse. It also re-runs the peek.

**Holds while:** `background()`, `foreground()` and `backgroundFor(ms)` in `test/harness.mjs` stub `document.visibilityState`, and `src/app.jsx` calls auto-push when the page hides.

`backgroundFor(ms)` is that pair with `Date.now` frozen across it. The resume threshold is 60s, and no test can wait that long. The elapsed time is the argument, not the wall clock. The helper is deliberately not a remount. On iOS, a resume is not a remount. That distinction is the point of the resume reset.

`background()` restores `visibilityState` to visible when it returns. Without that, a hidden document makes the foreground peek return early. The automatic merge would then never run. A later test would fail while it looked for that button. The symptom would point away from the cause. All three visibility listeners read `document.visibilityState`, never `document.hidden`. So stubbing one property is enough.

## See also

- `ruled-head-resume-is-reopening`, the resume behaviour these helpers drive.
- `auto-push-safe-as-merge-exists`, the auto-push path that `background()` reaches.
- `testing-unfailable-assert-decor`, why a wait that asserts nothing cannot fail.
