# CI skips draft pull requests after a proof

**Status:** ruled 2026-10-11. The native job skips drafts (lane C1). The other jobs still run on drafts. Their skip waits for a scratch PR. The scratch PR must show that a skipped required check does not read as passing. Owner ruling, 2026-10-12: the scratch-PR proof is granted. A separate lane runs it and records the result below. No result is recorded yet.

The owner ruled on 2026-10-11 that CI skips draft PRs. The ruling has one condition. The skip for the other jobs waits until a scratch PR shows that a skipped required check does not read as passing. Until then, drafts keep running CI in those jobs. Native stays not a required check until the owner says so, see `native-ci-on-hosted-macos`.

The `pull_request` trigger in `.github/workflows/test.yml` lists four types: `opened`, `synchronize`, `reopened` and `ready_for_review`. The native job has a draft guard. The suite, scope, screens and zizmor jobs have none, so a draft PR runs them.

The rest of the change covers those four jobs and adds draft state to the concurrency keys, the native job's included. It lands as one change, after the scratch PR.

**Holds while:** as of 2026-10-12, only the native job in `.github/workflows/test.yml` has a draft guard, and native is not a required check.

## Scratch PR result

Not run yet. The lane that runs the scratch PR records its result here.

## See also

- `native-ci-on-hosted-macos` — the native job, which takes the same draft rule.
- `ci-filters-guarantee-no-rebuild` — the trigger filters the change must keep.
- `screens-checked-headless-in-ci` — the screens job, which the change also covers.
