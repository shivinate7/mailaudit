# The remote adapter is transport, not storage

`window.remote` is transport, not storage. It carries photos as well as the ledger, to a second, private repo. It still speaks only ids and blobs. `app.jsx` never learns a filename. It never learns the string `"ledger.json"` either. The naming rules live in `src/photo-rules.mjs`. Only `entry.jsx`, the platform layer, and `worker/core.mjs`, the Worker's photo route, import them. That route reads a name from the `/photos/<name>` path and lists names back, so the Worker also learns filenames.

`window.sync` is transport too. It posts the ledger object to the Worker, and it never sees a filename.

**Holds while:** within `src/`, only `src/entry.jsx` imports the naming helpers from `src/photo-rules.mjs`. Within `worker/`, only `worker/core.mjs` does. `src/app.jsx` never contains `ledger.json`, and `window.storage` uses localStorage.

localStorage remains the source of truth on each device. With a Worker key, the Worker holds the shared ledger, and the GitHub copy is a mirror of it. The app works fully offline either way.

## See also

- `photo-rules-fails-quietly` — the naming rules this adapter never learns
- `storage-split-three-adapters` — the local adapters this remote backs up
- `token-lives-outside-namespace` — the credential this transport uses without storing it as data
- `sync-revamp-cloudflare` — the Worker that now holds the shared ledger
