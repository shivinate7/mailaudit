# The token used to span two repositories

**Status:** closed, by the `mailaudit-data` move.

A single token once needed write access to two repositories. That widened what a leak could reach. Moving the ledger and photos into one private repo closed this thread. The token covers exactly one repository again. That was the main thing the merge bought. `mailaudit` is public, and the app never writes to it. So the shared-origin risk now has one private repo in its blast radius, not two. The mitigation is unchanged: Contents-only scope and one token per device. The token just covers less.

**Holds while:** `REMOTE` and `PHOTOS` in `src/entry.jsx` both name one repo, `mailaudit-data`.

## See also

- `one-repo-for-both-halves` — the move that closed this thread
- `fine-grained-token-single-repo` — the scope the token now holds to
- `the-token-sits-on-a-shared-origin` — the mitigation that stayed unchanged
