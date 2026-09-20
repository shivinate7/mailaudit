# The source repo is public and holds no data

The source repository is public and holds no data. That arrangement is what makes continuous integration and Pages free to run. The ledger repository stays private for hygiene, not for secrecy. A backup store does not belong in a repository that serves a public site. The real cost is that every device needs the access key for everything. GitHub answers a repository it cannot show with a not-found response rather than a permission error.

## The argument, as recorded

```
**`mailaudit` itself is PUBLIC and holds no data.** That is the arrangement this
setup exists to produce, and it is what makes Actions and Pages free. The
separation, measured anonymously after the move: the Pages site answers **200**,
while `api.github.com/repos/shivinate7/mailaudit-data` and
`raw.githubusercontent.com/shivinate7/mailaudit-data/data/ledger.json` both
**404**. The ledger repo stays private for hygiene rather than secrecy — a
backup store does not belong in the repo that serves a public site — but the
consequence is real: **every device needs the key for everything**, because
GitHub hides a repo you cannot see behind a 404 rather than a 403.
```

## See also

- `data-branch-setup` — the branch inside this repository that holds the ledger
- `photo-branch-must-preexist` — the branch inside this repository that holds the photos
- `fine-grained-token-single-repo` — the token scope this single repository allows
- `ci-workflow-filters-guarantee-no-rebuild-trigger` — why a public source repository stays untouched by backups
