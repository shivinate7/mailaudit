# CI compiles no app, because the app needs the iOS 27.1 SDK

**What.** No CI job compiles the native app. `native/Manifest/DuoSpine.swift` calls iOS 27.1 APIs. The hosted `macos-26` image holds Xcode 26.6 and SDK 26.5, with no Xcode 27 app and no iOS 27 SDK (see `native-runner-image-unverified`). An `app-build` job on that image would go red on every run. The native job runs the `swift test` package tests only, so a break in the app target shows only in a local build on the Mac.

The gap closes when a hosted macOS image ships Xcode 27. The runner-images readme names Xcode 27 as a public preview (issue 14404). Then build an `app-build` job: `xcodegen generate` in `native/`, then `xcodebuild build` for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO`. Give it the same needs, draft guard and concurrency block as `native`. Never run `xcodebuild test` in it: UI tests run once per batch on the Mac.

**Status:** open. The `xcode-27` hosted image now exists (Xcode 27.1, iOS 27.1 SDK), per the runner-images readme. The per-pull-request `app-build` job is still not built. The milestone run (`milestone-runs-full-suite`) builds the app through `make native-check`; this debt closes when that run has a green result.

**Decision:** `native-ci-on-hosted-macos`.
