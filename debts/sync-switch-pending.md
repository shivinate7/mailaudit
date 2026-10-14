# The Cloudflare switch is pending, so web still mirrors to GitHub

The switch moves the Worker to a new, empty Durable Object, as ruled in `sync-revamp-cloudflare` (Stage 4b rulings). Until it lands, each web device still pushes the merged ledger to the GitHub `data` branch, and `src/entry.jsx` still sends photos through the GitHub Contents API. Lane N4a waits for the switch too. The gap closes when the switch ships, the Cloudflare base carries the ledger and the photos, and the web paths leave the build.

**Status:** open. Stage 4b is built. The switch is not.

**Decision:** `sync-revamp-cloudflare`.
