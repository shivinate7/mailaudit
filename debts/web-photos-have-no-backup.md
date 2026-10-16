# No Worker snapshot covers a web photo

**What.** Web photos go to the Worker's `/photos` route. `src/app.jsx` writes them through `window.sync.photoPut`. The daily snapshots hold the ledger only (`worker/core.mjs`), so no daily snapshot covers a photo. Until the one-time copy runs, the 8 photos on the GitHub photo branch are not on the Worker. `scripts/copy-photos-to-worker.mjs` makes that copy, and it is a dry run by default.

**Status:** open. Slice S2 merged in PR #100 (a214855). Slice S3, the adapter clean-up, is not done, and the GitHub photo methods on `window.remote` stay defined in `src/entry.jsx`. Whether the copy has run is not yet confirmed.

**Decision:** `sync-revamp-cloudflare`.
