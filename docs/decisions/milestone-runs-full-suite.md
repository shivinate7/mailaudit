# The full Swift suite runs at milestones

**Status:** ruled. The owner's ruling, from roadmap step c95 (owner item 31 e, 2026-10-27 12:07 CDT): "trust first, then cut in steps, each only past its measured bar, stepping back on a miss". Step 3 of that ruling is milestone runs. The full Swift suite runs at milestones on a GitHub-hosted Mac, with a recorded result. The count N = 3 is a lane default and is unmeasured. Coordinator 2026-11-01 18:44 CST, process-only: once the proof is in all-jobs-passed, a failed (red) milestone run blocks the next merge. Coordinator 2026-11-01 22:06 CST, process-only, can be undone: the `milestone-proof` job stays outside all-jobs-passed until its first green hosted run, and a test in `test/ci-wiring.test.mjs` pins that order. The coordinator reads that order as fitting "only past its measured bar". The staging holds branch protection only. The merge tool counts every check on a pull request and every dispatch run on main, required or not. So the first red, timed-out or cancelled hand dispatch makes `milestone-proof` fail on every pull request and stops every merge, rollup or not. Until the first dispatch, the proof passes (no run yet). The barrier before then is that nobody dispatches (coordinator 2026-11-01 23:00 CST, process-only). See Milestone proof.

**Holds while:** this repo is public, so hosted macOS minutes cost nothing. Also, the merge tool refuses a merge when the newest completed main run of any workflow file failed. Also, the two job caps stay provisional until green runs exist, and the milestone proof stays out of all-jobs-passed until the first green hosted run (coordinator 2026-11-01 22:06, process-only).

Kind: build

Plan: docs/decisions/milestone-runs-full-suite.md#the-workflow (native)

The full suite is `make native-check`: the page check, the Kit tests, the app build and every UI test but the Duo classes (`DUO_UI_TESTS` in the Makefile). It is too slow for each pull request, and the `native` job in `test.yml` runs only the Kit tests, see `native-ci-on-hosted-macos`. `.github/workflows/milestone.yml` runs the full suite once the native code has moved enough.

## The workflow

- Trigger: `workflow_dispatch` only (coordinator 2026-11-01 22:44, process-only). It never runs on `pull_request`, `push` or `schedule`. The first hosted run of the two-job split is a hand dispatch on main. It waits until the known reds clear: owner item 148 (the tab-bar skip) and debts `native-pinned-card-dynamic-type`, `tally-audit-contrast-flags` and `native-orphaned-colours-unbuilt`, or until the owner rules otherwise (coordinator 2026-11-01 23:00, process-only). The merge tool judges dispatch runs on main, so an earlier red run would stop every merge. So the split has no hosted proof before merge: a green pull request proves only the wiring (rule `verification-green-proves-only-its-fixtures`). The pull request that adds `milestone-proof` to all-jobs-passed, after the first green dispatch run, also decides the trigger. The merge tool judges the newest completed main run of each workflow file, whatever its trigger. A later green push or schedule run would hide a failed dispatch run, so the file has one trigger on main.
- Two parallel jobs on the `xcode-27` runner (runner-images `xcode-27-arm64`: Xcode 27.1 by default, iOS 27.1 SDK, iPhone 18 Pro on iOS 27.0, iPhone Duo on iOS 27.1). Each job selects `/Applications/Xcode_27.1.app`, installs one pinned xcodegen, creates an iPhone 18 Pro simulator on iOS 27.1, the owner's runtime, and boots it by its UDID. Job `part-a` runs `make tokens-check kit-test ui-a`, the `UI_TESTS_A` classes. Job `part-b` runs `make ui-b`, every other class but Duo.
- The Makefile stays the one home of the full run. `UI_TEST` names the UI test command: `sim-test` on the owner's Mac, `xcodebuild test` with a destination on the runner. Only the runner sets it.
- The Duo test classes are skipped through the Makefile list `DUO_UI_TESTS`. They need the hinge tool and separate pose runs. The gap is named in debt `native-ui-tests-not-in-ci`.
- The step summary records the head sha, the Xcode version and the result. That summary is the recorded result.
- The jobs skip drafts. Their caps are 45 and 50 minutes, provisional until they have 5 green runs. A run that stops at its cap is a timed-out job. The merge tool reads it as green, so the milestone proof below must catch it.
- Permissions are `contents: read`. No step writes.

## First hosted run

Run 41379087325, the first hosted run on 2026-11-02, hit its 50-minute cap. 102 of 136 UI tests ran and 46 failed. The run now splits into two parallel jobs, as above, and the Duo test classes skip. The known reds map to debts `native-pinned-card-dynamic-type`, `tally-audit-contrast-flags` and `native-orphaned-colours-unbuilt`, and to owner item 37, the open question in decision `audit-skips-measured-flags`. No skip assumes how item 37 is answered.

## When a run is due

`scripts/milestone-due.mjs` holds `milestoneDue`, a pure function, and a CLI mode. The `milestone-due` job in `test.yml` runs the CLI on a push to main. Its dispatch step needs the job's `MILESTONE_AUTO_DISPATCH` to be `on`. It is `off` until the pull request that adds `milestone-proof` to all-jobs-passed, and a wiring test pins the two together (coordinator 2026-11-01 23:00, process-only). It reads the dispatched milestone runs on main, counts the first-parent commits that touch native paths since a base sha, and, if the run is due, dispatches `milestone.yml`:

- If the newest completed run failed or timed out, the base sha is its head. Otherwise it is the head of the newest successful run. With neither, every commit counts.
- No run yet: due.
- The newest run is queued or in progress: not due.
- The newest run failed or timed out: recovery is a hand dispatch, see Milestone proof. Only a native merge past the proof, by the owner's bypass, makes the run due again.
- Otherwise: due once the count reaches N. A cancelled run is not a failure.

N is 3. That is a lane default, and no measure backs it. Change `N` in the script and its test together.

Cost per push to main: one ubuntu job, one API read, one `git log`. A read that gets a 5xx, a rate limit or a network error waits once, up to 10 s, and tries again. A second failure fails the job. Pull requests start the job, and no step runs. The job-level `actions: write` cannot depend on the event, so every CI step carries the push-to-main guard. On a pull request the token is granted and never used.

The native path regex is one file, `.github/native-paths.regex`. The `scope` job and the CLI both read it, and neither inlines it. A grep reads the file as ERE and the CLI reads it as a JavaScript regex, so it stays in the subset both read the same.

## Cost

Minutes are $0 on a public repo. The costs that hold are wall time and queue time, because hosted macOS runners queue. The run is not on the merge path of a pull request, but the milestone proof and the merge tool both read its result, see Milestone proof. If the repo goes private, GitHub bills macOS minutes at a multiple of Linux minutes, see `ledger-private-source-public`. The time of a hosted run is unmeasured until a green run lands, see `native-job-hosted-time-unmeasured`.

## Milestone proof

The proof joins all-jobs-passed only after the first green hosted run. Until then it is outside branch protection's required check. But a red run still stops merges through the merge tool. So the first hand dispatch waits for the known reds to clear. Coordinator 2026-11-01 22:06, process-only, can be undone: the `milestone-proof` job joins all-jobs-passed in the pull request after the first green hosted run. A test in `test/ci-wiring.test.mjs` pins that order.

Coordinator 2026-11-01 19:35, process-only. It comes from the global rule `verification-report-unknown-reads`: a read that could not run is unknown, never clear. Once the proof is in all-jobs-passed, a milestone run that timed out, was cancelled, or was dispatched and never taken is no proof. It blocks merges until a run passes.

The merge tool reads a timed-out run as green and judges completed runs only, so it cannot hold this itself. The repo checks it. The `milestone-proof` job in `test.yml` runs on every pull request and push. `node scripts/milestone-due.mjs proof` reads the dispatched milestone runs on `main` and calls `proofVerdict`. It names the branch `main`, because on a pull request the ref name that Actions sets is the pull request number plus `/merge`. The job holds `contents: read` and `actions: read`, and no `if:` narrows it to an event. A job that cannot read its proof must fail.

`milestoneRuns` is the one reader of those runs, for the proof job and for `milestone-due`. It reads the repo's run list (`actions/runs`, branch `main`, event `workflow_dispatch`), not the per-workflow list, which answers 404 while the workflow file is not yet on `main`. It keeps the runs whose path is the milestone workflow file. It reads only the first page, 100 runs, newest first. Past 100 dispatched runs, an older run is not seen. One thrown network error on the read is retried once.

`proofVerdict` walks the runs from the newest:

- A run that is not completed is in flight: queued, in progress, waiting, requested or pending. A fresh one is skipped, because its result is not in. One older than 90 minutes was not taken, and the check fails. An unreadable `createdAt` counts as stale.
- The first completed run decides. Only `success` passes. `failure`, `timed_out`, `cancelled`, `neutral` and `skipped` fail.
- With no completed run and no stale run, the check passes. This is the bootstrap: the first milestone run has no older proof to lack. A lone fresh run in flight passes the same way.

A re-run keeps its `createdAt` and raises its attempt number. A re-run in flight (attempt above 1) is never skipped: the check fails it as "re-run of a failed run; no proof yet". Staleness reads the time the run started, and `createdAt` when a run has none. Staleness is 90 minutes, and no measure backs it.

Once the proof is in all-jobs-passed, a failed proof blocks merges. So no push to main follows, and `milestone-due` dispatches nothing. Recovery from a failed proof is a dispatch by hand of `milestone.yml` on main. A dispatch on another branch is not read. If the `xcode-27` runner never takes a run, the stale run fails the proof of every pull request. Once the proof is in all-jobs-passed, the fix pull request is blocked too. Then recovery is a hand dispatch, or the owner's bypass of branch protection. A pull request that went red during recovery needs a re-run of its checks once `milestone.yml` has a green run.

A pull request can edit its own copy of the proof script, so it can pass itself. The check guards a mistake, not an attacker (rule `guard-guards-mistakes-only`). Branch protection and review hold the rest.

## Unproven

- The xcodegen release 2.46.0 is pinned by version and checked by sha256. The digest was read from a download, not from a hosted run.
- No hosted run has passed. Debts `app-build-waits-xcode-27`, `native-ui-tests-not-in-ci` and `native-runner-image-unverified` stay open until a green run proves them.

## See also

- `native-ci-on-hosted-macos` — the per-pull-request native job, which runs the Kit tests only.
- `ci-skips-draft-prs` — the draft guard that every job here carries.
- `one-simulator-per-mac` — why the owner's Mac runs UI tests through `sim-test`.
