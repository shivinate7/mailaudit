# Sync runs itself, with no toggle

Push runs on a 90-second idle debounce and on backgrounding. The merge runs on a foreground after enough time away, and on a cold mount. There is no auto-push toggle, because a per-device switch turned a quiet background job into something the user had to remember to turn on. An off toggle on one device was a silent way to go unbacked-up for months. Continuous sync on every save was rejected too, because the ledger blob rewrites whole, and GitHub's secondary rate limit sits far above the chosen debounce. The repository growth this could cause turned out to be small. The push count and blob size live in `ledger-and-seed-sizes`.

## The argument, as recorded

```
**Sync runs itself, and there is no toggle.** Push on a 90s idle debounce plus
backgrounding; the *merge* on a foreground after `RESUME_RESET_MS` away, and on
a cold mount. The `● Auto-push` toggle is gone — a per-device switch for "does
this work" turned the thing the app is supposed to do quietly into a thing you
had to opt into, and an off toggle on the other device is a silent way to be
unbacked-up for months. (`auto` survives unread in `entry.jsx`'s record;
removing a stored field is its own migration question.) What was rejected was *continuous* sync — a
push per check-in, at the 500ms save cadence — and that is still rejected: the
ledger blob is rewritten *whole*, and GitHub's secondary limit is 80
content-generating requests/min and 500/hr, shared with photos. The 90s debounce
is two orders of magnitude off that.

The repo-growth worry that argued against it turned out to be small, and there
are numbers: the real ledger blob is **235KB**, and all **19 pushes** of it
bundle to **39KB** — git deltas near-identical JSON to roughly 2KB a version.
At tens of pushes a mail day that is single-digit MB a year.
```

## See also

- `auto-push-safe-because-merge-exists` — the rule that makes this automatic push safe
- `two-device-merge-must-be-proven-first` — the proof required before turning this loose on two devices
- `push-and-merge-guard-differently` — what this automatic push and merge each refuse to run over
