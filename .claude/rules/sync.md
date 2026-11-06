---
paths:
  - "src/app.jsx"
  - "src/entry.jsx"
  - "src/b64.mjs"
  - "src/sync-rules.mjs"
  - "src/remote-rules.mjs"
  - "src/merge-rules.mjs"
  - "src/photo-rules.mjs"
  - "worker/**"
  - "scripts/send-key.mjs"
  - "scripts/copy-photos-to-worker.mjs"
---

# Storage and sync

- `versions-get-their-own-database` — Saved versions live in their own IndexedDB database.
- `shared-origin-needs-namespace` — The Pages origin is shared, so storage is namespaced.
- `every-origin-has-own-storage` — Every origin holds a separate ledger.
- `file-protocol-works-locally` — The file protocol supports everything the app needs.
- `b64-fails-with-plausible-data` — Base64 lives in its own module.
- `photo-rules-fails-quietly` — Photo rules are pure and separately tested.
- `remote-rules-fail-quietly` — Remote status mapping is pure and tested.

## Sync, the remote and the token

Sync runs itself. These records say what it refuses to do, and why each refusal is the safe direction to fail in.

- `remote-is-transport-not-storage` — The remote adapter is transport, not storage.
- `sync-runs-itself` — Sync runs itself, with no toggle.
- `push-and-merge-guard-differently` — Retired: the push guard left with the GitHub mirror.
- `auto-push-safe-as-merge-exists` — Retired: auto-push left with the GitHub mirror.
- `sha-accepted-only-after-apply` — The stored sha waits for the apply.
- `pushforce-sha-only-after-write` — Retired: no caller reaches the GitHub force path.
- `peek-is-three-valued` — Retired: the app no longer calls peek.
- `listphotos-is-three-valued` — listPhotos is three-valued too.
- `offline-is-decided-by-fetch` — Offline is decided by a failed fetch.
- `stale-push-conflict-pull-two-tap` — Retired: the stale-push merge ran on the GitHub mirror.
- `merge-carries-no-two-tap-arm` — Merge runs unattended, with no two-tap arm.
- `max-cannot-express-an-uncheck` — A per-key time lets an un-check beat an older check.
- `envelope-deletion-unrepresented` — A discarded envelope leaves a tombstone that a stale copy cannot revive.
- `two-device-merge-proven-first` — Retired: its two-device steps drove the GitHub mirror.
- `merge-readopts-sync-generation` — A merge re-adopts the sync generation.
- `push-flash-waits-for-photos` — Retired 2026-10-12: the Pushed flash has no control.
- `remote-sync-is-off-the-save-path` — Remote sync never touches the save indicator.
- `token-lives-outside-namespace` — The device key and any stored GitHub token sit outside the storage namespace.
- `one-repo-for-both-halves` — The source repo is public and holds no data.
- `data-branch-setup` — The data branch is frozen ledger history, not a scratch file.
- `photo-branch-must-preexist` — The GitHub photo branch stays until the copy runs.
- `pull-fetches-photos-before-apply` — A merge fetches photos before it applies.
- `ledger-and-photos-share-a-repo` — The private data repo holds the frozen history and the photo source.
- `photo-writes-wait-one-second` — Retired: GitHub photo writes left the web app.
- `null-remote-info-is-not-no-key` — A null remote status is not a missing key.
- `worker-keeps-snapshots` — The Worker keeps daily snapshots, and GitHub leaves the sync role.
- `sync-revamp-cloudflare` — Sync moves from GitHub to Cloudflare.

## Measurements

- `sync-latency` — Sync delay from a tap on one device to the row on the other.
