# Photo writes wait one second after the ledger

**Status:** retired 2026-10-14. It spaced GitHub Contents writes to one repo. The web app writes photos to the Worker now. `pushPhotos` runs `PHOTO_AFTER_POST_MS` (1000 ms) after a ledger POST returns ok. A POST made during a push adds one more pass. The GitHub adapter still defines `push()` with `spaceWrites()` until slice S3 removes it.

**Holds while:** `spaceWrites` is called in `src/entry.jsx`, `src/app.jsx` calls no GitHub push, and `PHOTO_AFTER_POST_MS` is 1000 in `src/app.jsx`.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md
