# When a mock field stops being decorative

A mock field that nothing reads can stay wrong for a long time, without harm. In `test/harness.mjs`, `acceptPull` set `pulledAt` to the frozen `REMOTE_NOW`. That repeated the hole that the comment two functions below already warns about for `pushedAt`. Nothing read `pulledAt`, so the frozen value stayed. When `syncBroken` began to read it, every merged device would have looked permanently stale. The healthy state would have been unreachable from a test. The harness needed this correction before the behaviour could be proven.

**Holds while:** `acceptPull` in `test/harness.mjs` sets `pulledAt` to `Date.now()`, and `syncedAt` in `src/app.jsx` reads `pulledAt`.

When a mock field stops being decorative, re-read the comment beside the field that already mattered.

## See also

- `testing-mock-is-test-below-seam` — why an honest mock matters below an untestable seam
- `testing-check-something-rereads` — the read-side version of the same trap
