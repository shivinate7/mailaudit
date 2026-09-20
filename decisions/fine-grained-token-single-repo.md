# One fine-grained token, scoped to one repo

Each device gets its own named fine-grained personal access token. It is scoped to only the private data repository, so any one device can be revoked alone. The token used to span two repositories, and that was a listed open risk, now closed. The scope grants only read and write on repository contents, nothing else. Fine-grained tokens cap at 366 days, so a real expiry date and a calendar reminder matter. The only symptom of expiry is a push that quietly stops working.

## The argument, as recorded

```
4. Settings → Developer settings → Personal access tokens → **Fine-grained**.
   Name it per device (`mailday-iphone`) so one can be revoked alone. Only
   select repositories: **`mailaudit-data` only.** One repo, which is the point
   — the token used to span two and that was a listed open thread. `mailaudit`
   is public and the app never writes to it.
   Repository permissions: **Contents → Read and write** (Metadata → Read-only
   appears automatically and is required). Nothing else. **Fine-grained PATs cap at 366 days** — set a real expiry and a
   calendar reminder, because when it lapses the only symptom is a push that
   stops working.
```

## See also

- `the-token-lives-outside-the-namespace` — the storage guarantee that protects this same token
- `one-repo-for-both-halves` — the single repository this token is scoped to
- `the-token-is-a-credential` — the invariant this scoping exists to protect
