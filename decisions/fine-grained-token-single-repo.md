# One fine-grained token, scoped to one repo

Each device gets its own named fine-grained personal access token. Name it per device, for example `mailday-iphone`. Then one device's token can be revoked alone.

**Holds while:** `REMOTE` and `PHOTOS` in `src/entry.jsx` both name one repo, `mailaudit-data`.

Scope the token to one repository only: `mailaudit-data`. One repo is the point. The token used to span two repositories. That was a listed open thread, and the single-repo scope closes it. `mailaudit` is public, and the app never writes to it.

To create the token, go to Settings → Developer settings → Personal access tokens → **Fine-grained**. Select repositories: **`mailaudit-data` only.** Set repository permissions to **Contents → Read and write**. Metadata → Read-only appears automatically and is required. Grant nothing else.

**Fine-grained PATs cap at 366 days.** Set a real expiry date and a calendar reminder. When the token lapses, the only symptom is a push that stops working.

## See also

- `the-token-lives-outside-the-namespace` — the storage guarantee that protects this same token
- `one-repo-for-both-halves` — the single repository this token is scoped to
- `the-token-is-a-credential` — the invariant this scoping exists to protect
