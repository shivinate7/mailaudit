# Whether the hosted runner image has Xcode 27 and xcodegen is unverified

The native job runs on `macos-26`. Whether that image has Xcode 27 and xcodegen is unknown. If it lacks xcodegen, the job installs a pinned version. The gap closes when a hosted run log shows the tools the image holds, and the workflow is set to match.

**Status:** open.

**Decision:** `native-ci-on-hosted-macos`.
