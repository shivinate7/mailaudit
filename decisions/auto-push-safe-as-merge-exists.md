# Auto-push is safe only because merge exists

**Status:** retired 2026-10-14. Auto-push left the web app with the GitHub mirror. The merge that made it safe lives on as the Worker merge: `mergeLedger` runs in `src/merge-rules.mjs` and in `worker/core.mjs`. See `merge-later-change-wins`.

**Holds while:** `worker/core.mjs` calls `mergeLedger`, and `src/app.jsx` has no auto-push function.

Kind: process

Home: decisions/sync-revamp-cloudflare.md
