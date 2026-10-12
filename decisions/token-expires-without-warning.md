# The token expires with no warning

**Status:** open.

Fine-grained personal access tokens cap at 366 days. When a token lapses, the app gets a 401. Every push then fails. Nothing warns the user beforehand, so the first sign of trouble is a sync that has already stopped.

No GitHub token field is on screen now (test 65.1 forbids the text "Add a GitHub key"), so a token cannot be replaced from the app. A lapsed token raises no sync line now (orchestrator default, 2026-10-12). The History error for `auth` in `REMOTE_SAYS` reads "Older versions can’t be loaded on this device." It names no key and no GitHub. See `ruled-head-one-advisory-entrance`.

**Holds while:** no expiry warning comes before a 401. No expiry text reaches the screen in `src/app.jsx`. Its one mention of an expired token is a code comment.

## See also

- `fine-grained-token-single-repo` — the token this expiry applies to
- `the-token-is-a-credential` — why the token cannot simply be stored more permissively
- `ruled-head-one-advisory-entrance` — the line that would eventually surface this failure
