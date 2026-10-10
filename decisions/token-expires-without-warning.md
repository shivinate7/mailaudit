# The token expires with no warning

**Status:** open.

Fine-grained personal access tokens cap at 366 days. When a token lapses, the app 401s and says "expired or been revoked". Every push then fails. Nothing warns the user beforehand, so the first sign of trouble is a sync that has already stopped.

A device whose sync is healthy has no way into the sync panel. So a key cannot be rotated early. In practice, a token that needs replacing has already expired. That errors, and the error raises the sync line.

**Holds while:** no expiry warning comes before a 401. The only expiry text in `src/app.jsx` is the message shown after one.

## See also

- `fine-grained-token-single-repo` — the token this expiry applies to
- `the-token-is-a-credential` — why the token cannot simply be stored more permissively
- `ruled-head-one-advisory-entrance` — the line that would eventually surface this failure
