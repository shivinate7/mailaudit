# The native job runs on a hosted macOS runner

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lane C1 landed the job in PR #76. The `all-jobs-passed` rollup needs it, so it is required, see Required check. Its unmeasured facts are debts, see Unmeasured: `native-runner-image-unverified`, `native-runner-keychain-unverified` and `native-job-hosted-time-unmeasured`.

The native job in `.github/workflows/test.yml` runs the Swift package tests on a hosted macOS runner. Degen's self-hosted runner is not copied. The rest of the native checks are in Still open.

**Holds while:** this repo is public on GitHub, so hosted macOS minutes cost nothing.

Kind: build

Plan: docs/decisions/native-ci-on-hosted-macos.md#still-open (native)

## The job

- The job is named native. It runs on `macos-26`. Its timeout is 10 minutes, about 6x the slowest green run (95 s, 18 runs to 2026-10-22), for macOS start-up variance. The 3 minute limit cut run 39761031029 on main.
- It uses the same concurrency group pattern as the screens job: one group per sha on main, and cancel on a PR ref.
- It has `needs: [suite, scope]`. The suite runs first on Ubuntu, and it runs `check:rules` and `check:golden`. A red suite skips the job; the rollup is red then anyway.
- The job skips draft PRs, as every job does, see `ci-skips-draft-prs`. `ready_for_review` starts a new run when a draft is marked ready.
- The job has work when scope reports a native change, on nightly and dispatch runs, and when scope fails (fail safe). With no work, the job still runs and passes, so the rollup reads it as success, not skipped. It runs on `ubuntu-latest` and skips its steps. With work, it runs on `macos-26`. One condition picks the runner and gates the steps.
- Steps, in order: print the Xcode and Swift versions, then ST.
- ST means `swift test --package-path native/ManifestKit`, see `native-build-lanes`.
- The paths filter for native and shared files is in `ci-filters-guarantee-no-rebuild`.

## Required check

Owner ruling, 2026-10-30 15:03 CDT: branch protection requires one check, `all-jobs-passed`, and that job needs every job. The native job is one of them, so a red native run blocks a merge. This replaces the 2026-10-12 ruling that kept native not required. The 2026-10-11 ruling still holds: the scope job and the nightly run decide whether the job has work.

## Cost

- The real costs are queue time and wall time. The estimate for the full job is 8 to 15 minutes a run. It is unmeasured. Debt: `native-job-hosted-time-unmeasured`.
- The last screens job took 37 seconds (run 38169582645).
- Measured on 2026-10-12, on this Mac and not a hosted runner (Xcode 27.0, an iPhone 17 simulator on iOS 27.0): `build-for-testing` took 26 s. The N5 UI tests took 139 s wall and 78.6 s in XCTest. Five tests ran: 4 passed, 1 skipped (the 760pt case), 0 failed.
- If the repo goes private, GitHub bills macOS minutes at a multiple of Linux minutes. The rate was not checked. See `ledger-private-source-public`.

## Rejected

Degen's self-hosted runner. On a public repo, a fork PR would run on the owner's Mac.

## Unmeasured

- Whether the runner image has Xcode 27 and xcodegen. If it lacks xcodegen, the job installs a pinned version. Debt: `native-runner-image-unverified`.
- Whether the runner keychain is unlocked. The key store tests use their own service name, see `native-key-via-url-scheme`. Debt: `native-runner-keychain-unverified`.
- The hosted-runner time of the UI tests. The 139 s figure in Cost is local. Debt: `native-job-hosted-time-unmeasured`.

## Still open

- Update, 2026-10-12: lane N5 landed without the steps. Its diff does not touch the workflow, so the native job still runs ST only. Debt: `native-ui-tests-not-in-ci`.

## See also

- `screens-checked-headless-in-ci` — the other macOS job. The native UI test (`native/ManifestUITests/PackagesShellUITests.swift`) is not in this job yet, see Still open.
- `ci-filters-guarantee-no-rebuild` — the trigger filters that the new job must respect.
- `ledger-private-source-public` — why the repo is public.
