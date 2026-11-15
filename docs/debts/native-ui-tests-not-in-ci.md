# Native UI tests and builds are not in CI

**What.** The native job runs the ST tests only, so native UI tests and builds are not in CI. Its workflow runs `xcodebuild -version` and `swift --version`, and nothing else. Lane C2 adds the missing steps. In order, they are:

- pin Xcode with `xcode-select`;
- run xcodegen;
- build for macOS and for the iOS Simulator with `CODE_SIGNING_ALLOWED=NO`;
- run every UI test class in `native/ManifestUITests`.

The gap closes when the job runs those steps and stays green on a hosted macOS runner. The Duo pose UI tests run in `duo-ui.yml`, see `duo-ui-runs-on-pr-label`. No run of that workflow has passed yet.

**Status:** open. The Duo classes (`DUO_UI_TESTS` in the Makefile) run in `duo-ui.yml`, see `duo-ui-runs-on-pr-label`. This debt closes for them on the first green `duo-ui` run, and no such run has happened yet. The milestone workflow (`milestone-runs-full-suite`) runs by dispatch on the hosted `xcode-27` image, in two jobs (`make ui-a` and `make ui-b`). It builds the app and runs every UI test class but the Duo classes. This debt closes for those classes when a milestone run is green. No run has passed yet. The per-pull-request native job still runs the Kit tests only. Lane C2 is not briefed.

**Decision:** `native-ci-on-hosted-macos`.

**Decision:** `duo-ui-runs-on-pr-label` (the Duo classes).
