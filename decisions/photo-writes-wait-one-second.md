# Photo writes wait one second after the ledger

**Status:** retired 2026-10-14. It spaced GitHub Contents writes to one repo. The web app writes photos to the Worker now, and `pushPhotos` runs after the ledger POST. The GitHub adapter still defines `push()` with `spaceWrites()` until slice S3 removes it.

**Holds while:** `spaceWrites` is called in `src/entry.jsx`, and `src/app.jsx` calls no GitHub push.

Kind: process

Home: decisions/sync-revamp-cloudflare.md
