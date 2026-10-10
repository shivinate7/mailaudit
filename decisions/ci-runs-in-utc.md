# CI runs the suite outside UTC, so test 38.9 runs there

**Status:** open.

GitHub Actions sets `TZ` to UTC. Test 38.9 skips itself in that zone, on purpose, because it has nothing to claim there. So the `suite` job pins `TZ=America/New_York` on its one `npm test` run, and 38.9 runs on every CI run.

`check:docs` does not run the suite again. CI tees the run's output to a file and names it in `CHECK_DOCS_SUITE_LOG`. `check:docs` reads the count from that file. If the file is missing or holds no count, it fails. If the variable is unset, as in local use, it runs the suite itself under the same zone.

What this still does not prove: the UTC path. The skip branch of 38.9 no longer runs in CI. A green check proves only its platform and the states its fixtures build. This one now proves the non-UTC state.

## See also

- `testing-jsdom-has-no-layout` — another case where a green run proves only its own platform
- `check-build-ignores-seed` — a different published-count workaround with the same shape
- `suite-size` — the published count `check:docs` reads from the pinned-zone run
