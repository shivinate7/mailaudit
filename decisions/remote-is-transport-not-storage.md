# The remote adapter is transport, not storage

`window.remote` is transport, not storage. It is the GitHub adapter, and it once carried the ledger and photos to a second, private repo. The ledger left it with the switch. Its photo methods stay defined, and no caller reaches them, see `web-photos-have-no-backup`. It still speaks only ids and blobs. `app.jsx` never learns a filename. It never learns the string `"ledger.json"` either. The naming rules live in `src/photo-rules.mjs`. Only `entry.jsx`, the platform layer, and `worker/core.mjs`, the Worker's photo route, import them. That route reads a name from the `/photos/<name>` path and lists names back, so the Worker also learns filenames.

`window.sync` is transport too. It posts the ledger object to the Worker, and it never sees a filename. It has no photo methods yet.

**Holds while:** within `src/`, only `src/entry.jsx` imports the naming helpers from `src/photo-rules.mjs`. Within `worker/`, only `worker/core.mjs` does. `src/app.jsx` never contains `ledger.json`, and `window.storage` uses localStorage.

localStorage remains the source of truth on each device. With a Worker key, the Worker holds the shared ledger. The GitHub `data` branch is frozen, and no device writes it. The app works fully offline either way.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-rules-fails-quietly` — the naming rules this adapter never learns
- `storage-split-three-adapters` — the local adapters this remote backs up
- `token-lives-outside-namespace` — the credential this transport uses without storing it as data
- `sync-revamp-cloudflare` — the Worker that now holds the shared ledger
