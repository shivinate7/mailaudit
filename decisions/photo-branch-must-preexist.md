# The photo branch must exist before any upload

Photos live on the `main` branch of `mailaudit-data`, in `photos/`. That branch must exist before any Contents PUT. A PUT into a repo with no commits is not a path worth relying on. So if you recreate the repo, initialise it with a README. Keep the repo private. These are pictures of mailing labels with the delivery address on them, so privacy is not optional.

**Holds while:** `PHOTOS` in `src/entry.jsx` writes to branch `main` under `photos`. `shivinate7/mailaudit-data` is private and has a `main` branch.

## See also

- `data-branch-setup` — the sibling setup step for the ledger branch
- `one-repo-for-both-halves` — the repository both branches share
- `remote-is-transport-not-storage` — the adapter that writes into this branch
