# Native UI tests and builds are not in CI

**What.** The native job runs the ST tests only, so native UI tests and builds are not in CI. Its workflow runs `xcodebuild -version` and `swift --version`, and nothing else. Lane C2 adds the missing steps. In order, they are:

- pin Xcode with `xcode-select`;
- run xcodegen;
- build for macOS and for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO`;
- run every UI test class in `native/ManifestUITests`.

The gap closes when the job runs those steps and stays green on a hosted macOS runner. The Duo pose UI tests are a local proof only. CI does not run them.

**Status:** open. The milestone workflow (`milestone-runs-full-suite`) now runs `make native-check`, which builds the app and runs every UI test class on the hosted `xcode-27` image. No run has passed yet. This debt closes when a milestone run is green. The per-pull-request native job still runs the Kit tests only. Lane C2 is not briefed.

**Decision:** `native-ci-on-hosted-macos`.
