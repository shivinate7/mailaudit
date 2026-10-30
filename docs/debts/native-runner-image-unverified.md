# Whether the hosted runner image has Xcode 27 and xcodegen is unverified

**What.** Whether the `macos-26` runner image has Xcode 27 and xcodegen is unknown. The native job runs on `macos-26`. The `app-build` job installs xcodegen with brew when `command -v xcodegen` finds none, and brew gives no pinned version. The gap closes when a hosted run log shows the tools the image holds, and the workflow is set to match. The `app-build` job has not run on a hosted runner yet.

**Status:** open.

**Decision:** `native-ci-on-hosted-macos`.
