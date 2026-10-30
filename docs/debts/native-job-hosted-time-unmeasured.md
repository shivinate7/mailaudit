# The native job's time on a hosted runner is unmeasured

**What.** The 8 to 15 minute estimate for the full native job is unmeasured. The 139 s UI test figure was taken on a Mac, not a hosted runner. The UI tests are not in CI, see `native-ui-tests-not-in-ci`. The `app-build` job has a provisional 15 minute cap that no run has timed. The gap closes when hosted run logs give the `native` time, the `app-build` time and the UI test time, and all are written into `native-ci-on-hosted-macos`.

**Status:** open. The `app-build` time waits for its first non-draft run. The UI test time waits for `native-ui-tests-not-in-ci`.

**Decision:** `native-ci-on-hosted-macos`.
