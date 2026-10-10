# The token expires with no warning

**Status:** open.

Fine-grained GitHub tokens cap at 366 days. When one lapses, every push starts failing with an expired-or-revoked error. Nothing in the app warns the user beforehand, so the first sign of trouble is a sync that has already stopped.

## See also

- `fine-grained-token-single-repo` — the token this expiry applies to
- `the-token-is-a-credential` — why the token cannot simply be stored more permissively
- `ruled-head-one-advisory-line-is-the-only-entrance` — the line that would eventually surface this failure
