# The data branch is the ledger's history, not a scratch file

The data branch in the private repository already carries the ledger's full history. Its blob shas are content-addressed, so moving repositories needed no re-keying on any device. If the branch must be recreated, it starts as an orphan branch with one empty commit, and it must never merge into main.

## The argument, as recorded

```
1. The `data` branch already exists in `mailaudit-data`, carrying the ledger's
   full history (130 commits at the time of the move, tip blob identical to the
   old repo's — blob shas are content-addressed, which is why no device needed
   re-keying). To recreate it from scratch:
   ```bash
   git switch --orphan data && git commit --allow-empty -m "data branch: ledger backups live here, never merge to main" && git push -u origin data && git switch main
   ```
```
