# The native job's time on a hosted runner is unmeasured

The 8 to 15 minute estimate for the full native job is unmeasured. The 139 s UI test figure was taken on a Mac, not a hosted runner. The UI tests are not in the job yet, see `native-ui-tests-not-in-ci`. The gap closes when hosted run logs give the job time and the UI test time, and both are written into `native-ci-on-hosted-macos`.

**Status:** open. The UI test time waits for `native-ui-tests-not-in-ci`.

**Decision:** `native-ci-on-hosted-macos`.
