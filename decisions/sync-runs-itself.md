# Sync runs itself, with no toggle

Sync runs itself, and there is no toggle.

**Holds while:** `AUTO_PUSH_MS` is `90000` in `src/app.jsx`, and `SYNC_POST_MS` is `3000` in `src/sync-rules.mjs`. No Auto-push toggle is rendered.

- Push runs on a 90s idle debounce, and on backgrounding. With a Worker key, this push goes to GitHub as a mirror.
- Without a Worker key, the merge runs on a foreground after `RESUME_RESET_MS` away, and on a cold mount. With a key, GitHub is not read on resume, and the Worker reply does the merge.
- With a Worker key, the app POSTs the ledger `SYNC_POST_MS` after a change, and on foreground, pageshow and online. A reply applies after `IDLE_APPLY_MS` with no input.

The `● Auto-push` toggle is gone. A per-device switch for "does this work" turned the app's core job into something the user had to opt into. An off toggle on one device is a silent way to go unbacked-up for months. The stored `auto` field survives unread in `entry.jsx`'s record. Removing a stored field is its own migration question.

Continuous sync was rejected, and it still is for GitHub. It would push once per check-in, at the 500ms save cadence. The ledger blob is rewritten whole. GitHub's secondary limit is 80 content-generating requests/min and 500/hr, shared with photos. The 90s mirror debounce is two orders of magnitude off that limit. The Worker POST goes out 3 s after the last change, and GitHub's limit does not apply to it.

The repo growth this would cause turned out to be small. The real ledger blob is 235KB. All 19 pushes of it bundle to 39KB. Git deltas near-identical JSON to roughly 2KB a version. At tens of pushes a mail day, that is single-digit MB a year. The push count and blob size live in `ledger-and-seed-sizes`.

## See also

- `auto-push-safe-as-merge-exists` — the rule that makes this automatic push safe
- `two-device-merge-proven-first` — the proof required before turning this loose on two devices
- `push-and-merge-guard-differently` — what this automatic push and merge each refuse to run over
- `sync-revamp-cloudflare` — the Worker POST that now runs beside this push
