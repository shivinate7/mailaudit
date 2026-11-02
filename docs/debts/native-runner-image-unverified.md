# Whether the hosted runner image has Xcode 27 and xcodegen is unverified

**What.** Whether the `macos-26` runner image has Xcode 27 and xcodegen is unknown. The native job runs on `macos-26`. If it lacks xcodegen, the job installs a pinned version. The gap closes when a hosted run log shows the tools the image holds, and the workflow is set to match.

**Read, not run.** The runner-images readme for image 20261013.0424.1, read on 2026-10-30, lists default Xcode 26.6 and newest simulator SDK 26.5. It lists no Xcode 27 app and no iOS 27 SDK, and does not list xcodegen. Its banner says Xcode 27 is in public preview (runner-images issue 14404). This is a read of the readme, not a log of a run. See `app-build-waits-xcode-27`.

**Status:** open. The `macos-26` image lacks Xcode 27, per the readme read above. A separate `xcode-27` image exists. Its readme lists Xcode 27.1 by default, the iOS 27.1 SDK, the iPhone 18 Pro on iOS 27.0 and the iPhone Duo on iOS 27.1. Neither image lists xcodegen, so the milestone workflow installs a pinned release (`milestone-runs-full-suite`). A hosted run log is still needed. This debt closes when a milestone run is green.

**Decision:** `native-ci-on-hosted-macos`.
