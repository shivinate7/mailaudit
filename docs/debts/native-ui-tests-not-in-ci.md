# Native UI tests are not in CI

**What.** The `app-build` job compiles the app for the iOS Simulator, with xcodegen and `CODE_SIGNING_ALLOWED=NO`. Nothing in CI runs the UI tests in `native/ManifestUITests`. That is by design: UI tests run once per batch on the Mac, through `sim-test` (the ios-apps standard). The `app-build` job has not run yet. It skips drafts, so it is unproven until a non-draft run.

The gap closes when the owner rules that a UI test class runs in CI, and a hosted run shows it green. If the owner keeps UI tests on the Mac, close this debt and say so in `native-ci-on-hosted-macos`.

The Duo pose UI tests are a local proof only. CI does not run them.

**Status:** open. The compile landed; the UI tests are not in CI.

**Decision:** `native-ci-on-hosted-macos`.
