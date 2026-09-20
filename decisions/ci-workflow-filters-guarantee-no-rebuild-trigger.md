# CI filters replace the old no-workflows guarantee

Nothing the app writes should touch the source repository, so a backup can never trigger a site rebuild. The repository used to have no workflows at all, and that absence was the whole guarantee. Two workflows exist now, so the guarantee rests on their path filters instead. A third workflow must read those filters first. The test workflow deliberately skips the built page. The deploy script commits that page separately, and running the suite again on the same output would double every deploy for no new information. It also checks that the committed page still matches what the sources build.

## The argument, as recorded

```
2. Settings → Pages on **`mailaudit`** should read "Deploy from a branch:
   `main` / `(root)`". Nothing the app writes touches that repo any more, so a
   backup can no longer trigger a site rebuild by construction rather than by
   branch discipline.
   **The repo used to have no `.github/workflows` at all, and that absence was
   the guarantee that a ledger push triggers nothing.** There are two workflows
   now, so that guarantee rests on their filters instead — read them before
   adding a third. `test.yml` is `branches: [main]` plus a paths filter (nothing
   under `src/` or `test/` ever changes on `data`, which carries one file), and
   it deliberately does **not** trigger on `index.html`, because `npm run
   deploy` commits that separately and re-running the suite on the build output
   would double every deploy for no new information. It also checks the
   committed `index.html` still matches what the sources build — the one thing a
   local deploy can skip by accident — via `check:build`, which compares the
   code and ignores the seed for the reasons above. A second step runs
   `check:seed`, which decodes the seed the committed page actually carries and
   refuses anything outside `SEED_KEEP`: the two together ask whether the page
   is this repo's code, and then what its data publishes.
```

## See also

- `one-repo-for-both-halves` — why the source repository must stay untouched by a backup
- `check-build-ignores-seed` — the check one of these workflows runs
- `backup-watchdog-catches-silent-failure` — the other scheduled workflow in the private repository
