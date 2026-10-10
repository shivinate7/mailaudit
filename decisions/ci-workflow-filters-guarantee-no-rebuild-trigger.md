# CI filters replace the old no-workflows guarantee

Nothing the app writes should touch the source repository, so a backup can never trigger a site rebuild. The repository used to have no workflows at all, and that absence was the whole guarantee. Two workflows exist now, so the guarantee rests on their path filters instead. A third workflow must read those filters first. The test workflow deliberately skips the built page. The deploy script commits that page separately, and running the suite again on the same output would double every deploy for no new information. It also checks that the committed page still matches what the sources build.

## See also

- `one-repo-for-both-halves` — why the source repository must stay untouched by a backup
- `check-build-ignores-seed` — the check one of these workflows runs
- `backup-watchdog-catches-silent-failure` — the other scheduled workflow in the private repository
