# The GitHub photo branch stays until the copy runs

Photos lived on the `main` branch of `mailaudit-data`, in `photos/`. They now go to the Worker's `/photos` route. The GitHub photo branch is the source of the one-time copy of 8 photos, which `scripts/copy-photos-to-worker.mjs` makes, dry run by default. The copy has not run. Keep that branch, and keep the repo private. These are pictures of mailing labels with the delivery address on them, so privacy is not optional.

No caller in the web app writes the branch now, so the rule that it must exist before any Contents PUT is retired. If the repo is ever recreated, initialise it with a README first, because a PUT into a repo with no commits is not a path worth relying on.

**Holds while:** `PHOTOS` in `src/entry.jsx` names branch `main` under `photos`, and `shivinate7/mailaudit-data` is private and has a `main` branch.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md

## See also

- `data-branch-setup` — the frozen ledger branch in the same repo
- `one-repo-for-both-halves` — the repository both branches share
- `remote-is-transport-not-storage` — the adapter that holds this branch's writes
