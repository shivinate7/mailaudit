# peek is three-valued, not a guess

**Status:** retired 2026-10-14. The app no longer calls `peek()`. The GitHub adapter still defines it in `src/entry.jsx` until slice S3 removes it. A failed Worker call reads as unknown, see `sync-revamp-cloudflare`.

**Holds while:** `peek()` is defined in `src/entry.jsx`, and `src/app.jsx` has no call to it.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md
