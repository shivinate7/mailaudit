# A stale push merges, and it never overwrites

**Status:** retired 2026-10-14. The stale-sha push and its merge ran on the GitHub mirror, which left the build. The Worker's merge replaces them: a POST merges into the stored ledger, see `sync-revamp-cloudflare`.

**Holds while:** `src/app.jsx` sends no push to GitHub, and no caller reaches `pushForce`.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md
