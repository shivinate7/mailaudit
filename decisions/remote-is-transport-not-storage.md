# The remote adapter is transport, not storage

`window.remote` is transport, not storage. It is the GitHub adapter, and it once carried the ledger and photos to a second, private repo. The ledger left it with the switch. Its photo methods stay defined in `src/entry.jsx` until slice S3 removes them, and the web app no longer writes photos through them, see `web-photos-have-no-backup`. The adapter still speaks only ids and blobs. The naming rules live in `src/photo-rules.mjs`. Only `entry.jsx`, the platform layer, and `worker/core.mjs`, the Worker's photo route, import them. That route reads a name from the `/photos/<name>` path and lists names back, so the Worker also learns filenames.

`window.sync` is transport too. It posts the ledger object to the Worker. Since slice S2 it has `photoList`, `photoGet` and `photoPut` against `/photos`, and each photo call takes a file name.

**Status:** not met at 49b6911. `src/app.jsx` imports `photoName` and `photoIdFromName` from `src/photo-rules.mjs` (line 10), and it passes `photoName(id, type)` to `window.sync.photoPut`. So the app learns filenames. Open question for the owner: keep this rule and move the naming into `src/entry.jsx`, or amend the rule. The record stays as ruled until then.

**Holds while:** within `src/`, only `src/entry.jsx` imports the naming helpers from `src/photo-rules.mjs`. Within `worker/`, only `worker/core.mjs` does. `src/app.jsx` never contains `ledger.json`, and `window.storage` uses localStorage. The first clause is false at 49b6911, see Status.

localStorage remains the source of truth on each device. With a Worker key, the Worker holds the shared ledger. The GitHub `data` branch is frozen, and no device writes it. The app works fully offline either way.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-rules-fails-quietly` — the naming rules this adapter never learns
- `storage-split-three-adapters` — the local adapters this remote backs up
- `token-lives-outside-namespace` — the credential this transport uses without storing it as data
- `sync-revamp-cloudflare` — the Worker that now holds the shared ledger
