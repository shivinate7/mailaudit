# The Duo UI tests run on pull requests, and the Pro ones by label

The workflow `.github/workflows/duo-ui.yml` runs the UI tests that need a simulator the milestone run does not cover. It runs them on GitHub's `xcode-27` runner, on pull requests.

**Status:** ruled. Coordinator pick, 2026-11-08 (the parent session of lane `duo-ci-path`). Reversible. Process-only.

**Holds while:** this repo stays public, so hosted macOS minutes cost nothing. The shared reusable macOS workflow in claude-settings does not exist yet. When it lands, these jobs move to it.

Kind: build

Plan: docs/decisions/duo-ui-runs-on-pr-label.md#what-runs (native)

Plan: docs/decisions/duo-ui-runs-on-pr-label.md#gate (native)

## What runs

- `duo-ui` runs the three Duo classes on an iPhone Duo simulator. The list is `DUO_UI_TESTS` in the Makefile. The job folds the simulator with `hinge`, a simulator-folding tool pinned at commit `afb8f0bd`. It runs a flat pass, then a closed pass. The closed pass runs the two methods in `DUO_CLOSED_TESTS`.
- `pro-ui-a` and `pro-ui-b` run `make ui-a` and `make ui-b` on an iPhone 18 Pro simulator. That is the split `milestone-runs-full-suite` uses, without the Duo classes.
- `ci-done` runs after the three jobs. A red run posts one comment on the pull request. The comment wakes the session that watches the pull request (claude-settings rule `git-ci-done-comment-wakes`).
- Each job builds once with `make app-build`. The tests then run without a build step.
- Each job has a 60-minute cap. The cap is provisional.

## Trigger

- `pull_request` only, with the types `opened`, `synchronize`, `reopened`, `ready_for_review` and `labeled`.
- Never `workflow_dispatch`, `push`, `schedule` or `pull_request_target`. The workflow reads no secrets.
- A push cancels the older run of the same pull request. A `labeled` event never cancels a run in progress.
- The merge tool judges the newest completed run on `main` of every workflow file. This file has no `main` trigger, so it has no `main` run to judge.

## Gate

- The trigger's paths filter: `native/**`, `Makefile`, `shared/**`, `.github/workflows/duo-ui.yml` and `scripts/ci-sim.sh`. A pull request that touches none of them starts no run.
- `duo-ui` runs on a ready pull request, or on a draft that carries the label `duo-ui`. A `labeled` event starts it only for that label.
- `pro-ui-a` and `pro-ui-b` run only when the pull request carries the label `pro-ui`. A draft runs them too. A `labeled` event starts them only for that label.
- The Pro jobs need a label. The non-Duo suite has known reds, named in `milestone-runs-full-suite`. An automatic run would turn every native pull request red.

## Departs from `ci-skips-draft-prs`

- That decision skips drafts in every job of `checks.yml`. This workflow is another file. A labelled draft runs its jobs on purpose.
- A lane needs a run of the Duo classes while its pull request stays a draft. GitHub refuses to merge a draft (GitHub docs, not measured here). So a draft run is evidence, not a merge check.

## Outside the rollup

- `all-jobs-passed` does not need these jobs. Joining it needs an edit to `checks.yml`, which another lane owns.
- The milestone proof stayed out of the rollup until it had green runs (`milestone-runs-full-suite`). These jobs follow that order.
- The merge tool counts every check on a pull request, required or not. A red run here still blocks its own pull request.

## Guards

- False-green guard: each pass reads the executed count from its result bundle. The step fails unless the count equals the count `duo-counts` scans from the Swift sources. The flat pass expects the Duo tests minus the closed ones. The closed pass expects the closed ids. A skipped Duo test fails the pass. The Pro jobs check only that at least one test ran.
- Retries: each test runs up to two attempts. A test that needed a second attempt is listed in the step summary with its attempts. A pass on retry is green.
- Screenshots: the export step writes each bundle's attachments into `out/`. The pose step writes four `simctl io` captures, the outer and inner display for each pose, into `out/pose/`. The job uploads `out/` as an artifact.
- Each Duo test keeps one `.keepAlways` screenshot of the app window: `DuoShot` in DuoWindowSupport.swift, called from each Duo class's tearDown. It does not depend on `keepShot`, which stays off unless `DUO_SHOTS` is set. XCTest window shots may come back black on the Duo simulator; the exported images show whether they do.

## Not built

- No debt closes here. The Duo debts that wait for a CI path close on a green `duo-ui` run, cited in that debt.

## Unmeasured

- The hosted time of the Duo passes. Debt `native-job-hosted-time-unmeasured` covers the hosted time of the UI tests.
- Whether the merge tool reads an all-skipped run as red. This workflow makes such a run on a draft with no label, and on a `labeled` event for another label on a ready pull request, when the paths match. `ci-skips-draft-prs` says the merge tool reads a head whose jobs all skipped as red. It is unmeasured whether one all-skipped run of this file counts the same way.

## Unproven

- No run of this workflow has passed. Until one does, a green check proves only its wiring (the rule `verification-green-proves-only-its-fixtures`).
