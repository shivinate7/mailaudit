# CI skips draft pull requests after a proof

**Status:** ruled 2026-10-11, not built. Drafts run CI today. The skip waits for a scratch PR. The scratch PR must show that a skipped required check does not read as passing.

Today `.github/workflows/test.yml` runs on `pull_request` with no draft filter, so a draft PR runs the whole suite. The owner ruled on 2026-10-11 that CI skips draft PRs. The ruling has one condition. The skip waits until a scratch PR shows that a skipped required check does not read as passing. Until then, drafts keep running CI.

The change covers every job in `test.yml`. It also adds draft state to the concurrency keys. It lands as one change, after the scratch PR.

**Holds while:** the `pull_request` trigger in `.github/workflows/test.yml` has no `types` list and no draft filter.

## See also

- `native-ci-on-hosted-macos` — the native job, which takes the same draft rule.
- `ci-filters-guarantee-no-rebuild` — the trigger filters the change must keep.
- `screens-checked-headless-in-ci` — the screens job, which the change also covers.
