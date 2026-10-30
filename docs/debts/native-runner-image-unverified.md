# Whether the hosted runner image has Xcode 27 and xcodegen is unverified

**What.** Whether the `macos-26` runner image has Xcode 27 and xcodegen is unknown. The native job runs on `macos-26`. If it lacks xcodegen, the job installs a pinned version. The gap closes when a hosted run log shows the tools the image holds, and the workflow is set to match.

**Read, not run.** The runner-images readme for image 20261013.0424.1, read on 2026-10-30, lists default Xcode 26.6 and newest simulator SDK 26.5. It lists no Xcode 27 app and no iOS 27 SDK, and does not list xcodegen. Its banner says Xcode 27 is in public preview (runner-images issue 14404). This is a read of the readme, not a log of a run. See `app-build-waits-xcode-27`.

**Status:** open. The readme read says the image lacks Xcode 27; a hosted run log is still needed.

**Decision:** `native-ci-on-hosted-macos`.
