# The access token and the device key sit outside the storage namespace

The GitHub access token lives at the raw localStorage key `mailday-remote:v1`. The Worker device key lives at `mailday-sync:v1`. Both keys sit deliberately outside the `mailday:` namespace.

**Holds while:** `src/entry.jsx` stores the token at `mailday-remote:v1`, `src/sync-rules.mjs` sets `SYNC_KEY_STORAGE` to `mailday-sync:v1`, and neither key starts with `mailday:`.

`window.storage.list()` enumerates that prefix. Nothing calls it today. But the day someone adds a backup of everything in the namespace, the token would be swept into a file the user emails to themselves. Keeping the token outside the namespace makes that impossible by construction. Nobody has to remember the rule.

Verified in a browser. After saving a key, `storage.list()` still returns only `["mailday:v1"]`.

## See also

- `the-token-is-a-credential` — the invariant this placement protects
- `shared-origin-needs-namespace` — the namespace this token deliberately sits outside
- `fine-grained-token-single-repo` — the scope of the token kept out of that namespace
- `sync-revamp-cloudflare` — the Worker device key this placement also covers
