# Sync runs itself, with no toggle

Sync runs itself, and there is no toggle.

**Holds while:** `SYNC_POST_MS` is 3000 and `PRESS_TAIL_MS` is 700 in `src/sync-rules.mjs`, and no Auto-push toggle is rendered.

- With a Worker key, the app POSTs the ledger `SYNC_POST_MS` after a change, and on foreground, pageshow and online. The POST timer arms once per burst of changes, so a run of taps POSTs every `SYNC_POST_MS`. A reply applies as soon as no press is in progress, see `auto-apply-happens-now`.
- The GitHub push on a 90 s idle debounce is retired. The switch removed it, so no device writes GitHub, see `sync-revamp-cloudflare`.

The `● Auto-push` toggle is gone. A per-device switch for "does this work" turned the app's core job into something the user had to opt into. An off toggle on one device is a silent way to go unbacked-up for months. The stored `auto` field still sits in `entry.jsx`'s record, and the app does not read it. Removing a stored field is its own migration question.

Kind: process

Home: decisions/sync-revamp-cloudflare.md

## See also

- `sync-revamp-cloudflare` — the sync this rule now governs.
- `itp-may-clear-storage` — why an unattended sync is the safety net here
