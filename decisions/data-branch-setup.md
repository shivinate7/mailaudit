# The data branch is the ledger's history, not a scratch file

The `data` branch in `mailaudit-data` already exists. It carries the ledger's full history: 130 commits at the time of the move. Its tip blob is identical to the old repo's. Blob shas are content-addressed. So no device needed re-keying.

The branch survives the move for a new reason. `listVersions` reads its history as the version archive. The old reason, that Pages deploys from main's root, no longer holds. The repo serves no site.

**Holds while:** the private repo `mailaudit-data` has a `data` branch that holds `ledger.json`, and `REMOTE.branch` in `src/entry.jsx` is `data`.

If the branch must be recreated, it starts as an orphan branch with one empty commit. It must never merge into `main`. To recreate it from scratch, run:

```bash
git switch --orphan data && git commit --allow-empty -m "data branch: ledger backups live here, never merge to main" && git push -u origin data && git switch main
```

## See also

- `one-repo-for-both-halves` — why the ledger moved into this branch's repository
- `photo-branch-must-preexist` — the sibling setup step for the photo branch
- `watchdog-catches-silent-failure` — the workflow that reads this branch's history
