# CI runs in UTC, so test 38.9 never runs there

**Status:** open.

GitHub Actions sets `TZ` to UTC. Test 38.9 skips itself in that zone, on purpose, because it has nothing to claim there. So a green `suite` check on this repo's pull requests never runs 38.9. The global rule applies here directly: a green check proves only its platform and the states its fixtures build. As CI is configured today, the check proves nothing about 38.9.

`check:docs` works around the same fact for the published count. When it measures the suite, it pins a non-UTC zone. That fix does not reach the test run inside CI. CI still skips 38.9 on every run.

The gap is left as it is. The test is zone-conditional by design. Changing it would hide the real gap instead of naming it.

## See also

- `testing-jsdom-has-no-layout` — another case where a green run proves only its own platform
- `check-build-ignores-seed` — a different published-count workaround with the same shape
- `suite-size` — the published count `check:docs` measures under a pinned zone
