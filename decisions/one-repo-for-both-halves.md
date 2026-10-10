# The source repo is public and holds no data

The source repository, `mailaudit`, is public and holds no data. That arrangement is what makes Actions and Pages free to run. The ledger repository stays private for hygiene, not for secrecy. A backup store does not belong in a repository that serves a public site. GitHub answers a repository it cannot show with a not-found response rather than a permission error.

**Holds while:** `REMOTE` and `PHOTOS` in `src/entry.jsx` both name `mailaudit-data`, and `mailaudit` answers 200 to an anonymous request. Checked 2026-10-10.

Measured anonymously after the repo move, the Pages site answers 200. `api.github.com/repos/shivinate7/mailaudit-data` and `raw.githubusercontent.com/shivinate7/mailaudit-data/data/ledger.json` both answer 404.

The real cost is that every device needs the key for everything. GitHub hides a repo you cannot see behind a 404, not a 403.

## See also

- `data-branch-setup` — the branch inside this repository that holds the ledger
- `photo-branch-must-preexist` — the branch inside this repository that holds the photos
- `fine-grained-token-single-repo` — the token scope this single repository allows
- `ci-filters-guarantee-no-rebuild` — why a public source repository stays untouched by backups
