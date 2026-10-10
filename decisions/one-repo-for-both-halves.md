# The source repo is public and holds no data

The source repository is public and holds no data. That arrangement is what makes continuous integration and Pages free to run. The ledger repository stays private for hygiene, not for secrecy. A backup store does not belong in a repository that serves a public site. The real cost is that every device needs the access key for everything. GitHub answers a repository it cannot show with a not-found response rather than a permission error.

## See also

- `data-branch-setup` — the branch inside this repository that holds the ledger
- `photo-branch-must-preexist` — the branch inside this repository that holds the photos
- `fine-grained-token-single-repo` — the token scope this single repository allows
- `ci-workflow-filters-guarantee-no-rebuild-trigger` — why a public source repository stays untouched by backups
