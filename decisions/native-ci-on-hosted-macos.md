# The native job runs on a hosted macOS runner

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lane C1 lands the job in PR #76. The required-check ruling is not built. Two facts are unknown, see Unmeasured.

The native job in `.github/workflows/test.yml` runs the Swift package tests on a hosted macOS runner. Degen's self-hosted runner is not copied. The rest of the native checks are in Still open.

**Holds while:** this repo is public on GitHub, so hosted macOS minutes cost nothing.

## The job

- The job is named native. It runs on `macos-26`. Its timeout is 3 minutes, about 3.4x the 53 s first green run, for macOS start-up variance.
- It uses the same concurrency group pattern as the screens job: one group per sha on main, and cancel on a PR ref.
- It has `needs: [suite, scope]`. The suite runs first on Ubuntu, and it runs `check:rules` and `check:golden`. A red suite skips the job. The job runs when scope reports a native change, on nightly and dispatch runs, and when scope fails (fail safe).
- It skips draft PRs. `ready_for_review` starts it when a draft is marked ready, see `ci-skips-draft-prs`.
- Steps, in order: print the Xcode and Swift versions, then ST.
- ST means `swift test --package-path native/ManifestKit`, see `native-build-lanes`.
- The paths filter for native and shared files is in `ci-filters-guarantee-no-rebuild`.

## Required check

Owner ruling, accept all: the job becomes a required check after its first green run. A scope job and a nightly run gate it. Until then, the job is not required, and a red native run can merge.

## Cost

- The real costs are queue time and wall time. The estimate for the full job is 8 to 15 minutes a run. It is unmeasured.
- The last screens job took 37 seconds (run 38169582645).
- If the repo goes private, GitHub bills macOS minutes at a multiple of Linux minutes. The rate was not checked. See `ledger-private-source-public`.

## Rejected

Degen's self-hosted runner. On a public repo, a fork PR would run on the owner's Mac.

## Unmeasured

- Whether the runner image has Xcode 27 and xcodegen. If it lacks xcodegen, the job installs a pinned version.
- Whether the runner keychain is unlocked. The key store tests use their own service name, see `native-key-via-url-scheme`.

## Still open

- Lane N5 adds to the native job: the `xcode-select` pin for Xcode. Then, after ST, in this order: xcodegen; `xcodebuild build` for macOS and for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO`; the UI tests.
- Unmeasured: how a required check reads a job that the draft guard skipped. The scratch PR measures this.

## See also

- `screens-checked-headless-in-ci` — the other macOS job. The native UI test is lane N5, in Still open.
- `ci-filters-guarantee-no-rebuild` — the trigger filters that the new job must respect.
- `ledger-private-source-public` — why the repo is public.
