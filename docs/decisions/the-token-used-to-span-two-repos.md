# The token used to span two repositories

**Status:** retired.

A GitHub token once needed write access to two repositories. The move left one private repo, `mailaudit-data`, and no device holds a token now.

Kind: process

Home: docs/decisions/records-hold-current-text-only.md

**Holds while:** `REMOTE` and `PHOTOS` in `src/entry.jsx` both name one repo, `mailaudit-data`.

## See also

- `one-repo-for-both-halves` — the move that closed this thread
- `fine-grained-token-single-repo` — the scope the token once held to
