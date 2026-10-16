# pushForce records the sha after the write

**Status:** retired 2026-10-14. No caller reaches `pushForce`. The app sends no force. The adapter still defines it in `src/entry.jsx` until slice S3 removes it. While that code stays, its rule holds: the sha is recorded only after the write.

**Holds while:** `pushForce` is defined in `src/entry.jsx`, and `src/app.jsx` has no call to it.

Kind: process

Home: decisions/sync-revamp-cloudflare.md
