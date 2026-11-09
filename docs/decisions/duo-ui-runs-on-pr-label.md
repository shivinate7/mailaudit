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
- A newer run of the same pull request cancels the older one. Every run runs each job that the pull request's draft state and labels call for, so the newer run loses no job. A label event that ran only the newly labelled job could pass while an earlier run on the same head was red, and the merge tool judges the newest run. So any label added to a pull request that touches these paths, even an unrelated one, restarts the whole job.
- The merge tool judges the newest completed run on `main` of every workflow file. This file has no `main` trigger, so it has no `main` run to judge.

## Gate

- The trigger's paths filter: `native/**`, `Makefile`, `shared/**`, `.github/workflows/duo-ui.yml` and `scripts/ci-sim.sh`. A pull request that touches none of them starts no run.
- `duo-ui` runs on a ready pull request, or on a draft that carries the label `duo-ui`.
- `pro-ui-a` and `pro-ui-b` run only when the pull request carries the label `pro-ui`. A draft runs them too.
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

## Runs so far

- Run 42549989429, head 6a59dd5, 2026-11-08: Xcode 27.1, Duo runtime iOS-27-2-iPhone19-4 (the owner's Duo runs iOS 27.1). The job ran 35 min after 12 min queued: build 1 min, simulator boot 4 min, flat pass 26 min, closed pass under 1 min. Closed 2 of 2 green; flat 37 of 39 green on the first attempt. One sample, so the time is not a cap basis.
- Flaky timing: `testMatchRowClearsTheKeysUnderAReleasedBox` timed out on a UI query (201 s) on its first attempt and passed on retry. A pass on retry is never a debt citation (coordinator, 2026-11-08 21:05 CST).
- `testFlatPackagesLastRowClearsTheBar` failed both attempts. The cause was its movement measure on a lazy list, not the app: the measure now follows one row that exists before the first drag.
- Run 42561443103: `testFlatTallyLastRowClearsTheBar` failed from the scroll helper's `isHittable`; fixed at 3a4863d. The refund test failed on a host I/O stall (the spindump shows accessibility writes blocked in the kernel). Armed discard went over its 3.5 s budget on a slow runner.
- Run 42577148982, head 3a4863d, 2026-11-09: green. Flat 39 of 39 and closed 2 of 2 passed. The job ran 44 min after 14 min queued; the flat pass took 35 min.
- `testFailedLineCheckInShowsInHand` timed out on a UI query at 311 s on its first attempt in run 42577148982 and passed on retry. A pass on retry is not a first-attempt pass.

## Unmeasured

- The hosted time of the Duo passes beyond the two runs measured here: CI runs 42549989429 and 42577148982. Debt `native-job-hosted-time-unmeasured` covers the hosted time of the UI tests.
- Whether the merge tool reads an all-skipped run as red. This workflow makes such a run on a draft with no label, when the paths match. `ci-skips-draft-prs` says the merge tool reads a head whose jobs all skipped as red. It is unmeasured whether one all-skipped run of this file counts the same way.

## Unproven

- One run of this workflow has passed (42577148982, head 3a4863d). Until more do, a green check proves only its wiring (the rule `verification-green-proves-only-its-fixtures`).
