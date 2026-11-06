# One fine-grained token, scoped to one repo

**Status:** retired.

Web no longer writes to GitHub, and no device holds a GitHub token, so no token is minted (`live-verification`).

Kind: process

Home: docs/decisions/records-hold-current-text-only.md

**Holds while:** no device holds a GitHub token (`live-verification`).

## See also

- `token-lives-outside-namespace` — where the GitHub token sits in storage, if one is stored
- `the-token-is-a-credential` — the invariant on the token and the device key
