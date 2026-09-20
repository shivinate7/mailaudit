# CI runs in UTC, so test 38.9 never runs there

**Status:** open.

GitHub Actions sets the timezone to UTC. Test 38.9 skips itself in that zone on purpose, because it has nothing to claim there. A green suite check on this repo's pull requests never actually executes 38.9. `check:docs` pins a non-UTC zone to measure the published test count correctly. That fix never reaches the test run inside CI itself.

## The thread, as recorded

```
- **CI runs in UTC, so test 38.9 never runs there.** GitHub Actions sets `TZ`
  to UTC. 38.9 skips itself in that zone, on purpose, because it has nothing
  to claim there. So a green `suite` check on this repo's pull requests never
  actually executes 38.9. The global rule applies here directly: a green
  check proves only its platform and the states its fixtures build. This one
  proves nothing about 38.9, ever, as CI is configured today. `check:docs`
  works around the same fact for the published count, by pinning a non-UTC
  zone when it measures the suite. That fix does not reach the test run
  inside CI itself, which still skips 38.9 on every run. Left as is: the test
  is deliberately zone-conditional, and changing it would hide the real gap
  instead of naming it.
```

## See also

- `testing-jsdom-has-no-layout` — another case where a green run proves only its own platform
- `check-build-ignores-seed` — a different published-count workaround with the same shape
- `suite-size` — the published count `check:docs` measures under a pinned zone
