# CI skips draft pull requests

Kind: build

**Status:** ruled 2026-10-11. Every job in `.github/workflows/test.yml` skips draft PRs.

The owner ruled on 2026-10-11 that CI skips draft PRs. The ruling had one condition: a skip must not make a required check read as passing. Owner ruling, 2026-10-30 15:03 CDT: branch protection requires one check, `all-jobs-passed`. It fails when a job it needs is skipped. It runs on `if: ${{ always() && !github.event.pull_request.draft }}`, the same as degen's, so on a draft it skips too. A draft PR cannot merge, so nothing reads the draft skips. That meets the condition by design.

Each job has `!github.event.pull_request.draft` in its job-level `if:`, so a draft starts no runner. The `pull_request` trigger lists four types: `opened`, `synchronize`, `reopened` and `ready_for_review`. `ready_for_review` starts a new run when a draft is marked ready, and in that run every job and the rollup run.

A skip for any reason other than a draft lives at step level, because the rollup would read it as a failure on a run that should pass. See `native-ci-on-hosted-macos` and `screens-checked-headless-in-ci`.

Draft state is in the concurrency keys of the suite, screens, native and ste-lint jobs, so a draft run and a ready run on one head never cancel each other. Owner ruling 2026-10-12 ("Land it now, alone"): the keys landed before the draft skip, because they stop a cancelled run at each merge.

**Holds while:** as of 2026-10-30, branch protection on `main` requires `all-jobs-passed` alone. That job needs every check job and skips only on a draft, and GitHub refuses to merge a draft PR.

## Scratch PR result

Run on 2026-10-12 as scratch PR #83, closed unmerged. Draft run 38265934901 and ready run 38266281235. While draft, suite, scope, screens and zizmor ran and passed, native skipped, and the merge state read CLEAN. Native was not required then. The PR did not measure how a skipped required check reads. Under the rollup, a required check skips only on a draft, which cannot merge, so that question no longer applies.

## See also

- `native-ci-on-hosted-macos` — the native job and its step-level scope skip.
- `screens-checked-headless-in-ci` — the screens job and its step-level scope skip.
- `ci-filters-guarantee-no-rebuild` — the trigger filters the change must keep.
