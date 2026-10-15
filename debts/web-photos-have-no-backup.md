# Web photos reach no backup until the Worker carries them

The web ledger syncs through the Worker alone, as ruled in `sync-revamp-cloudflare`. Photos do not. The GitHub photo methods on `window.remote` are defined, but no caller reaches them. So a new label photo stays on the device that took it, and no backup holds it. `window.sync` has no photo methods. Slice S2 adds list, put and get against the Worker `/photos` route. Slice S3 removes the dead GitHub write paths from the adapter.

**Status:** open. The ledger switch is built. Photos (S2) and the adapter clean-up (S3) are not.

**Decision:** `sync-revamp-cloudflare`.
