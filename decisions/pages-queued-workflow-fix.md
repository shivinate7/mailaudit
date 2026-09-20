# A stuck Pages deploy needs a new commit, not a re-run

GitHub Pages serves the site from the main branch root. When the Pages workflow sits queued for more than ten minutes, re-running the same run does not help. The fix is to cancel it and push a trivial commit to start a fresh run.

## The argument, as recorded

```
GitHub Pages serves from main branch root. Deploy quirk learned the hard way:
if the Pages workflow sits Queued >10 min, don't re-run the same run — cancel
it and push a trivial commit to spawn a fresh run.
```

## See also

- `ci-workflow-filters-guarantee-no-rebuild-trigger` — the workflow filters this deploy quirk sits beside
- `one-repo-for-both-halves` — the repository this Pages deploy serves
