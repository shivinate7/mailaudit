# Sync runs itself, with no toggle

Push runs on a 90-second idle debounce and on backgrounding. The merge runs on a foreground after enough time away, and on a cold mount. There is no auto-push toggle, because a per-device switch turned a quiet background job into something the user had to remember to turn on. An off toggle on one device was a silent way to go unbacked-up for months. Continuous sync on every save was rejected too, because the ledger blob rewrites whole, and GitHub's secondary rate limit sits far above the chosen debounce. The repository growth this could cause turned out to be small. The push count and blob size live in `ledger-and-seed-sizes`.

## See also

- `auto-push-safe-because-merge-exists` — the rule that makes this automatic push safe
- `two-device-merge-must-be-proven-first` — the proof required before turning this loose on two devices
- `push-and-merge-guard-differently` — what this automatic push and merge each refuse to run over
