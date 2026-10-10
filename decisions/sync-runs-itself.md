# Sync runs itself, with no toggle

Sync runs itself, and there is no toggle.

**Holds while:** `AUTO_PUSH_MS` is `90000` in `src/app.jsx`. No Auto-push toggle is rendered.

- Push runs on a 90s idle debounce, and on backgrounding.
- The merge runs on a foreground after `RESUME_RESET_MS` away, and on a cold mount.

The `● Auto-push` toggle is gone. A per-device switch for "does this work" turned the app's core job into something the user had to opt into. An off toggle on one device is a silent way to go unbacked-up for months. The stored `auto` field survives unread in `entry.jsx`'s record. Removing a stored field is its own migration question.

Continuous sync was rejected, and it still is. It would push once per check-in, at the 500ms save cadence. The ledger blob is rewritten whole. GitHub's secondary limit is 80 content-generating requests/min and 500/hr, shared with photos. The 90s debounce is two orders of magnitude off that limit.

The repo growth this would cause turned out to be small. The real ledger blob is 235KB. All 19 pushes of it bundle to 39KB. Git deltas near-identical JSON to roughly 2KB a version. At tens of pushes a mail day, that is single-digit MB a year. The push count and blob size live in `ledger-and-seed-sizes`.

## See also

- `auto-push-safe-because-merge-exists` — the rule that makes this automatic push safe
- `two-device-merge-must-be-proven-first` — the proof required before turning this loose on two devices
- `push-and-merge-guard-differently` — what this automatic push and merge each refuse to run over
