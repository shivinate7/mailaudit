# The GitHub photo PUT and pull have never run

**What.** `pushPhoto` and `pullPhoto` on `window.remote` (`src/entry.jsx`) have never run against real GitHub. No web code calls them now, because photos use `window.sync` to talk to the Worker. The copy script's live GitHub read of the photo branch on 2026-10-16 is not a run of `pullPhoto`. See `live-verification`.

**Status:** open. When slice S3 removes the GitHub adapter's photo methods, this gap closes. Running them does not close it. Until then both methods stay defined and unrun.

**Decision:** `sync-revamp-cloudflare`.
