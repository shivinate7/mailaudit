# A stuck Pages deploy needs a new commit, not a re-run

GitHub Pages serves the site from the main branch root. When the Pages workflow sits queued for more than 10 minutes, do not re-run the same run. Cancel it instead. Then push a trivial commit to start a fresh run.

## See also

- `ci-workflow-filters-guarantee-no-rebuild-trigger` — the workflow filters this deploy quirk sits beside
- `one-repo-for-both-halves` — the repository this Pages deploy serves
