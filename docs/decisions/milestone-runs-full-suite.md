# The full Swift suite runs at milestones

**Status:** ruled. The owner ruled on 2026-10-27 (claude-settings step c95, applied 2026-11-01): the full Swift suite runs at milestones on a GitHub-hosted Mac, with a recorded result, and a failed milestone run blocks the next merge. The count N = 3 is the coordinator's pick, pending the owner.

**Holds while:** this repo is public, so hosted macOS minutes cost nothing. Also, the merge tool refuses a merge when the newest completed main run of any workflow file failed.

Kind: build

Plan: docs/decisions/milestone-runs-full-suite.md#the-workflow (native)

The full suite is `make native-check`: the page check, the Kit tests, the app build and every UI test. It is too slow for each pull request, and the `native` job in `test.yml` runs only the Kit tests, see `native-ci-on-hosted-macos`. `.github/workflows/milestone.yml` runs the full suite once the native code has moved enough.

## The workflow

- Triggers: `workflow_dispatch`, and `pull_request` limited to the workflow file itself. It never runs on `push` or `schedule`. The merge tool judges the newest completed main run of each workflow file, whatever its trigger. A later green push or schedule run would hide a failed dispatch run, so the file has one trigger on main.
- One job, `full-suite`, on the `xcode-27` runner (runner-images `xcode-27-arm64`: Xcode 27.1 by default, iOS 27.1 SDK, iPhone 18 Pro on iOS 27.0, iPhone Duo on iOS 27.1). It selects `/Applications/Xcode_27.1.app`, installs one pinned xcodegen, boots the iPhone 18 Pro by name and runs `make native-check`.
- The Makefile stays the one home of the full run. `UI_TEST` names the UI test command: `sim-test` on the owner's Mac, `xcodebuild test` with a destination on the runner. Only the runner sets it.
- The job writes the head sha, the Xcode version and the result to the step summary. That summary is the recorded result.
- The job skips drafts and has `timeout-minutes: 50`, marked provisional until it has 5 green runs. A run that stops at its cap is a timed-out job. See Open questions for how the red-main check reads it.
- Permissions are `contents: read`. No step writes.

## When a run is due

`scripts/milestone-due.mjs` holds `milestoneDue`, a pure function, and a CLI mode. The `milestone-due` job in `test.yml` runs the CLI on a push to main. It reads the dispatched milestone runs on main, counts the first-parent commits that touch native paths since a base sha, and dispatches `milestone.yml` if the run is due:

- The base sha is the head of the newest completed run if that run failed or timed out. Otherwise it is the head of the newest successful run. With neither, every commit counts. A push to a failed main does not dispatch again until a native merge follows the failure.
- No run yet: due.
- The newest run is queued or in progress: not due.
- The newest run failed or timed out: due once one native merge follows it.
- Otherwise: due once the count reaches N. A cancelled run is not a failure.

N is 3. That is the coordinator's pick, and the owner has not set it. Change `N` in the script and its test together.

Cost per push to main: one ubuntu job, one API read, one `git log`. A read that gets a 5xx or a rate limit waits once, up to 10 s, and tries again. A second failure fails the job. Pull requests start the job, and no step runs. The job-level `actions: write` cannot depend on the event, so every CI step carries the push-to-main guard. On a pull request the token is granted and never used.

The native path regex is one file, `.github/native-paths.regex`. The `scope` job and the CLI both read it, and neither inlines it. A grep reads the file as ERE and the CLI reads it as a JavaScript regex, so it stays in the subset both read the same.

## Cost

Minutes are $0 on a public repo. The costs that hold are wall time and queue time, because hosted macOS runners queue. The run is not on the merge path of a pull request, so only a failed milestone run blocks a merge. If the repo goes private, GitHub bills macOS minutes at a multiple of Linux minutes, see `ledger-private-source-public`. The time of a hosted run is unmeasured until a green run lands, see `native-job-hosted-time-unmeasured`.

## Open questions

All three wait for the owner to rule.

- Open: a run that stops at its cap reads as green to the red-main check, because a timed-out job is not red there. A hung suite would not block a merge.
- Open: a dispatched run that no runner takes reads as no run to the red-main check, because the check judges completed runs only. A merge goes ahead while the run waits. `milestoneDue` reads a queued run as not due, so no second dispatch follows.
- Open: a cancelled newest run is not a failure to `milestoneDue`, but the red-main check reads it as unknown and refuses merges. With merges refused, no push follows, so nothing dispatches again. The owner dispatches a run by hand, or merges past it.

## Unproven

- The xcodegen release 2.46.0 is pinned by version and checked by sha256. The digest was read from a download, not from a hosted run.
- No hosted run has passed. Debts `app-build-waits-xcode-27`, `native-ui-tests-not-in-ci` and `native-runner-image-unverified` stay open until a green run proves them.

## See also

- `native-ci-on-hosted-macos` — the per-pull-request native job, which runs the Kit tests only.
- `ci-skips-draft-prs` — the draft guard that every job here carries.
- `one-simulator-per-mac` — why the owner's Mac runs UI tests through `sim-test`.
