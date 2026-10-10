# CI runs in UTC, so test 38.9 never runs there

**Status:** open.

GitHub Actions sets the timezone to UTC. Test 38.9 skips itself in that zone on purpose, because it has nothing to claim there. A green suite check on this repo's pull requests never actually executes 38.9. `check:docs` pins a non-UTC zone to measure the published test count correctly. That fix never reaches the test run inside CI itself.

## See also

- `testing-jsdom-has-no-layout` — another case where a green run proves only its own platform
- `check-build-ignores-seed` — a different published-count workaround with the same shape
- `suite-size` — the published count `check:docs` measures under a pinned zone
