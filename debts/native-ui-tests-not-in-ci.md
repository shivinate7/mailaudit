# Native UI tests and builds are not in CI

**What.** The native job runs the ST tests only, so native UI tests and builds are not in CI. Its workflow runs `xcodebuild -version` and `swift --version`, and nothing else. Lane C2 adds the missing steps. In order, they are:

- pin Xcode with `xcode-select`;
- run xcodegen;
- build for macOS and for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO`;
- run every UI test class in `native/ManifestUITests`.

The gap closes when the job runs those steps and stays green on a hosted macOS runner.

**Status:** open. Lane C2 is not briefed.

**Decision:** `native-ci-on-hosted-macos`.
