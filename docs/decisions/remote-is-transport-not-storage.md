# The remote adapter is transport, not storage

`window.remote` is transport, not storage. It is the GitHub adapter, and it once carried the ledger and photos to a second, private repo. The ledger left it with the switch. Its photo methods stay defined in `src/entry.jsx` until slice S3 removes them, and the web app no longer writes photos through them, see `web-photos-have-no-backup`. The adapter still speaks only ids and blobs. The naming rules live in `src/photo-rules.mjs`. Only `entry.jsx`, the platform layer, and `worker/core.mjs`, the Worker's photo route, import them. That route reads a name from the `/photos/<name>` path and lists names back, so the Worker also learns filenames.

`window.sync` is transport too. It posts the ledger object to the Worker. Since slice S2 it has `photoList`, `photoGet` and `photoPut` against `/photos`. Each photo call takes a photo id, and `src/entry.jsx` turns the id into a file name.

**Status:** met at 4db47be. The orchestrator call of 2026-10-15 kept this rule and moved the photo naming into `src/entry.jsx`. `src/app.jsx` now imports only `photoPlan` from `src/photo-rules.mjs`, which names no file.

**Holds while:** within `src/`, only `src/entry.jsx` imports the naming helpers from `src/photo-rules.mjs`. Within `worker/`, only `worker/core.mjs` does. `src/app.jsx` never contains `ledger.json`, and `window.storage` uses localStorage.

localStorage remains the source of truth on each device. With a Worker key, the Worker holds the shared ledger. The GitHub `data` branch is frozen, and no device writes it. The app works fully offline either way.

Kind: build

Plan: docs/decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-rules-fails-quietly` — the naming rules this adapter never learns
- `storage-split-three-adapters` — the local adapters this remote backs up
- `token-lives-outside-namespace` — the credential this transport uses without storing it as data
- `sync-revamp-cloudflare` — the Worker that now holds the shared ledger
