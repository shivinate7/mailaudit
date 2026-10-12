# The native job runs on a hosted macOS runner

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lane C1 builds it and has not landed. The 2026-10-11 rulings in Required check and Still open are ruled and not built. Two facts are unknown, see Unmeasured.

The native checks run as one job in `.github/workflows/test.yml`, on a hosted macOS runner. Degen's self-hosted runner is not copied.

**Holds while:** this repo is public on GitHub, so hosted macOS minutes cost nothing.

## The job

- The job is named native. It runs on `macos-26`. Its timeout is set from its first green run. The rule is ci-hygiene step 5: about 2x the slowest green run. No value is ruled before then.
- It uses the same concurrency group pattern as the screens job: one group per sha on main, and cancel on a PR ref.
- It has `needs: suite`. So `check:golden` and `check:rules` run first on Ubuntu, and they gate the job.
- Xcode is pinned with `xcode-select`.
- Steps, in order: ST, then xcodegen, then `xcodebuild build` for macOS and for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO`, then the UI tests.
- ST means `swift test --package-path native/ManifestKit`, see `native-build-lanes`.
- The paths filter for native and shared files is in `ci-filters-guarantee-no-rebuild`.

## Required check

Owner ruling, accept all: the job becomes a required check after its first green run. A scope job and a nightly run gate it. Until then, the job is not required, and a red native run can merge.

## Cost

- The real costs are queue time and wall time. The estimate is 8 to 15 minutes a run. It is unmeasured.
- The last screens job took 37 seconds (run 38169582645).
- If the repo goes private, GitHub bills macOS minutes at a multiple of Linux minutes. The rate was not checked. See `ledger-private-source-public`.

## Rejected

Degen's self-hosted runner. On a public repo, a fork PR would run on the owner's Mac.

## Unmeasured

- Whether the runner image has Xcode 27 and xcodegen. If it lacks xcodegen, the job installs a pinned version.
- Whether the runner keychain is unlocked. The key store tests use their own service name, see `native-key-via-url-scheme`.

## Still open

- The draft skip is ruled, with a condition. The job follows `ci-skips-draft-prs`. A scratch PR must first show that a skipped required check does not read as passing.
- Unmeasured: how a required check reads a job that the draft guard skipped. The scratch PR measures this.
- The trigger list `types: [opened, synchronize, reopened, ready_for_review]` and the draft guard are not in the workflow yet.

## See also

- `screens-checked-headless-in-ci` — the other macOS job, and the native UI test.
- `ci-filters-guarantee-no-rebuild` — the trigger filters that the new job must respect.
- `ledger-private-source-public` — why the repo is public.
