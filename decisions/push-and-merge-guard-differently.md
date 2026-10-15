# Push and merge guard on different confirms

**Status:** retired 2026-10-14. The push guard ran in the GitHub mirror, which left the build. The Worker POST refuses nothing, because it changes nothing on this device. The merge guard still applies. The merge refuses while composing, undo, or any armed confirm is live, because it applies a remote ledger. A Worker reply's apply waits on the same check.

**Holds while:** `mergeBlocked` in `src/app.jsx` gates the held apply of a Worker reply.

Kind: process

Home: decisions/sync-revamp-cloudflare.md
