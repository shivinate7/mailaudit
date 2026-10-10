# When a mock field stops being decorative

A mock field left unread can sit wrong for a long time without harm. The harness froze `pulledAt` at a fixed clock value because nothing read it. The day a real check started reading it, every merged device would have looked permanently stale. When a mock field starts mattering, its neighbor comment needs a second look too.

## See also

- `testing-a-mock-is-the-test-below-the-seam` — why an honest mock matters below an untestable seam
- `testing-check-that-something-re-reads-the-value` — the read-side version of the same trap
