# The data branch is the ledger's history, not a scratch file

The data branch in the private repository already carries the ledger's full history. Its blob shas are content-addressed, so moving repositories needed no re-keying on any device. If the branch must be recreated, it starts as an orphan branch with one empty commit, and it must never merge into main.

## See also

- `one-repo-for-both-halves` — why the ledger moved into this branch's repository
- `photo-branch-must-preexist` — the sibling setup step for the photo branch
- `backup-watchdog-catches-silent-failure` — the workflow that reads this branch's history
