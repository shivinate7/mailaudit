# Web photos still go through GitHub until the Worker carries them

The web ledger now syncs through the Worker alone, as ruled in `sync-revamp-cloudflare`. The mirror, auto-push, the foreground peek and the GitHub merge are gone from `src/app.jsx`. Photos are not moved yet. `src/entry.jsx` has no photo methods on `window.sync`, and the app's photo helpers still target `window.remote`, which nothing calls now. So a new label photo stays on the device that took it, and no backup holds it. Slice S2 adds list, put and get against the Worker `/photos` route, and it ships in the same batch as the switch. Slice S3 removes the dead GitHub write paths from the adapter.

**Status:** open. The ledger switch is built. Photos (S2) and the adapter clean-up (S3) are not.

**Decision:** `sync-revamp-cloudflare`.
