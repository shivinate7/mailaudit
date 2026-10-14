# CI skips draft pull requests after a proof

Kind: build

Plan: decisions/ci-skips-draft-prs.md#still-to-build (web)

**Status:** ruled 2026-10-11. The native job skips drafts (lane C1). The other jobs still run on drafts. Their skip waits for a scratch PR, which must show that a skipped required check does not read as passing. Owner ruling, 2026-10-12: the scratch-PR proof is granted. Scratch PR #83 ran on 2026-10-12, and its result is below. The proof is incomplete. Debt: `draft-skip-required-unmeasured`.

The owner ruled on 2026-10-11 that CI skips draft PRs. The ruling has one condition. The skip for the other jobs waits until a scratch PR shows that a skipped required check does not read as passing. Until then, drafts keep running CI in those jobs. Native stays not a required check until the owner says so, see `native-ci-on-hosted-macos`.

The `pull_request` trigger in `.github/workflows/test.yml` lists four types: `opened`, `synchronize`, `reopened` and `ready_for_review`. The native job has a draft guard. The suite, scope, screens and zizmor jobs have none, so a draft PR runs them.

Draft state is in the concurrency keys of the suite, screens and native jobs, so a draft run and a ready run on one head never cancel each other. Owner ruling 2026-10-12 ("Land it now, alone"): the keys land before the draft skip, because they stop a cancelled run at each merge and they skip no check. The draft guards for the other four jobs still wait for the second scratch PR.

**Holds while:** as of 2026-10-12, only the native job in `.github/workflows/test.yml` has a draft guard, and native is not a required check.

## Scratch PR result

Run on 2026-10-12 as scratch PR #83, closed unmerged. Draft run 38265934901 and ready run 38266281235.

- While draft, suite, scope, screens and zizmor ran and passed. Native skipped. The merge state read CLEAN.
- After ready, the same four jobs ran. Native skipped again, because the diff was README only and the scope job said no native change.
- Main requires only suite and screens. Both ran on the draft, so no required check was skipped.

The proof is incomplete. It shows that a skipped native job does not block a merge, because native is not required. It does not show how a skipped required check reads. That needs a draft guard on suite or screens, and a second scratch PR.

## Still to build

- A draft guard on the suite, scope, screens and zizmor jobs. It waits for a second scratch PR that shows how a skipped required check reads. Debt: `draft-skip-required-unmeasured`.

## See also

- `native-ci-on-hosted-macos` — the native job, which takes the same draft rule.
- `ci-filters-guarantee-no-rebuild` — the trigger filters the change must keep.
- `screens-checked-headless-in-ci` — the screens job, which the change also covers.
