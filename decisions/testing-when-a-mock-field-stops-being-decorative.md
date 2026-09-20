# When a mock field stops being decorative

A mock field left unread can sit wrong for a long time without harm. The harness froze `pulledAt` at a fixed clock value because nothing read it. The day a real check started reading it, every merged device would have looked permanently stale. When a mock field starts mattering, its neighbor comment needs a second look too.

## The argument, as recorded

```
`test/harness.mjs` needed the same correction to be able to prove it:
`acceptPull` set `pulledAt` to the frozen `REMOTE_NOW`, exactly the hole the
comment two functions below already warns about for `pushedAt`. It was left
frozen because nothing read it; the day `syncBroken` did, every merged device
would have been permanently stale and the healthy state unreachable from a
test. **When a mock's field stops being decorative, re-read the comment next to
the field that already wasn't.**
```

## See also

- `testing-a-mock-is-the-test-below-the-seam` — why an honest mock matters below an untestable seam
- `testing-check-that-something-re-reads-the-value` — the read-side version of the same trap
