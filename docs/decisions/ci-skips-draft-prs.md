# CI skips draft pull requests at step level

Kind: build

Plan: docs/decisions/ci-skips-draft-prs.md#still-to-build (web)

**Status:** ruled 2026-10-11. The native job skips its work on drafts (lane C1). The other jobs still run their work on drafts.

The owner ruled on 2026-10-11 that CI skips draft PRs. The ruling had one condition: a skip must not make a required check read as passing. Owner ruling, 2026-10-30 15:03 CDT: branch protection requires one check, `all-jobs-passed`. It runs on `if: ${{ always() && !github.event.pull_request.draft }}`, the same as degen's, and fails when a job it needs is skipped. So a job's skip lives at step level: the job runs, skips its steps and passes. On a draft the rollup itself skips. A draft PR cannot merge, and `ready_for_review` starts a new run in which the rollup runs. That meets the condition by design.

The `pull_request` trigger in `.github/workflows/test.yml` lists four types: `opened`, `synchronize`, `reopened` and `ready_for_review`. The native job has the draft guard. On a draft it runs on `ubuntu-latest` and skips its steps, so no macOS runner starts, see `native-ci-on-hosted-macos`. The suite, scope, screens, zizmor, ste-lint and ci-done jobs have no guard, so a draft PR runs them.

Draft state is in the concurrency keys of the suite, screens and native jobs, so a draft run and a ready run on one head never cancel each other. Owner ruling 2026-10-12 ("Land it now, alone"): the keys landed before any other draft skip, because they stop a cancelled run at each merge and they skip no check.

**Holds while:** as of 2026-10-30, branch protection on `main` requires `all-jobs-passed` alone. That job needs every check job and skips only on a draft. Only the native job in `.github/workflows/test.yml` has a draft guard.

## Scratch PR result

Run on 2026-10-12 as scratch PR #83, closed unmerged. Draft run 38265934901 and ready run 38266281235. While draft, suite, scope, screens and zizmor ran and passed, native skipped, and the merge state read CLEAN. Native was not required then. The PR did not measure how a skipped required check reads. Under the rollup, a required check skips only on a draft, which cannot merge, so that question no longer applies.

## Still to build

- A step-level draft guard on the suite, screens, zizmor and ste-lint jobs, in the shape of the native job's. No proof waits on it now.

## See also

- `native-ci-on-hosted-macos` — the native job, which carries the draft guard.
- `ci-filters-guarantee-no-rebuild` — the trigger filters the change must keep.
- `screens-checked-headless-in-ci` — the screens job, which the change also covers.
