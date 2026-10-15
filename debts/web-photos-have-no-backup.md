# Web photos reach no backup until the GitHub copy runs

Web photos now go to the Worker's `/photos` route. The 8 photos on the GitHub photo branch are not on the Worker until the one-time copy runs. `scripts/copy-photos-to-worker.mjs` makes that copy, and it is a dry run by default. Slice S3, the adapter clean-up, is not done. The GitHub photo methods on `window.remote` stay defined in `src/entry.jsx`.

**Status:** open. Slice S2 is built in the switch lane. The copy has not run, and the orchestrator runs it. S3 is not done.

**Decision:** `sync-revamp-cloudflare`.
