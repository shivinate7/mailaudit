# The iOS app ships Mac first, TestFlight as the fallback

After each merge, this Mac installs a Release build of MANIFEST on the owner's phone over Wi-Fi or cable. `ios-ship install tools/ios-ship.json --app Manifest` does the install. If it fails for any reason, a manual dispatch of the `testflight` workflow, `.github/workflows/testflight.yml`, uploads the same commit to TestFlight at once. Each dispatch needs the owner's go.

**Status:** ruled. Owner ruling, 2026-10-22 19:40 CDT, for every app: when the phone is on Wi-Fi and the Mac can install, take that route, with TestFlight as the fallback. It amends the ruling of 2026-10-21 13:58 CDT, which shipped through TestFlight only. Owner ruling, 2026-11-08 19:38 CST, on the waiting page as item 65 a (TestFlight upload from CI): the upload runs from CI, and the holds on it are lifted.

Kind: build

Plan: docs/decisions/build-and-deploy.md#make-testflight (native)

**Holds while:** the shared `ios-ship install` command installs a Release build from `tools/ios-ship.json`, `ios-ship testflight` archives and uploads from the same file, and the `testflight` workflow runs that upload from CI on a manual dispatch.

## The command

- `ios-ship testflight tools/ios-ship.json --app Manifest` runs `xcodegen`, archives Release for `generic/platform=iOS`, then uploads the archive to App Store Connect. The steps and flags are in `build-and-deploy`. It does not run `npm run build`, so check `npm run check:rules` first. The workflow does not run it either. Main's required checks run it in the `suite` job, see `.github/workflows/checks.yml`, and keep `native/ManifestKit/Sources/ManifestKit/rules.js` fresh.
- `--export-only` stops before the upload and keeps the export in a printed folder. It is the only proof run without an upload. The workflow's `dry` input passes it.
- On this Mac, `make testflight` runs the same upload as a local fallback, from a clean tree at origin/main. The tool is shared with the owner's Degen project.
- The upload runs once. Never retry it in a loop, and never re-dispatch the workflow in a loop.
- The App Store Connect key file, key id and issuer id are credentials. On this Mac they live in the ios-ship account file under ~/.config, off the repo. In CI they live in the repo secrets `ASC_KEY_P8`, `ASC_KEY_ID` and `ASC_ISSUER_ID`. Never read, copy or print the key file.

## The CI workflow

- `.github/workflows/testflight.yml` is the TestFlight fallback in CI. Its one trigger is `workflow_dispatch`, a manual dispatch. It runs on the `xcode-27` runner.
- Inputs: `apps`, default `Manifest`. `dry` passes `--export-only`, so a dry dispatch exports and does not upload.
- An upload runs only from main. ios-ship needs a clean tree, with HEAD equal to origin/main.
- The job fetches ios-ship from claude-settings at the pinned commit `eaaf66e`. It writes the App Store Connect key from the repo secrets into the runner's temp dir, ships, and then deletes the key in a step that always runs.
- Each dispatch needs the owner's go, dry and real alike. The runner slots are shared. Minutes cost nothing while the repo is public, and macOS minutes are billed once it goes private, see `milestone-runs-full-suite`.

## The build number

- The build number is a UTC timestamp to the minute, set at archive time. It has 12 digits: year, month, day, hour, minute. The first archive got 202610211858.
- `ios-ship` passes it as `CURRENT_PROJECT_VERSION` on the `xcodebuild archive` command line. So every target in the archive gets the same number.
- `CFBundleVersion` in `native/Manifest/Info.plist` is `$(CURRENT_PROJECT_VERSION)`. `native/project.yml` sets the default to 1 for builds that are not archives.
- `ITSAppUsesNonExemptEncryption` is false in the same file.

## The app icon

The archive holds `Assets.car` and `CFBundleIconName` AppIcon, from the catalog in `native/Manifest/Assets.xcassets`. The round-1 review found the catalog missing, which App Store Connect rejects. The icon is the master, see `assets-and-icons`. Checked on an archive of 2026-10-21 with `plutil`.

## The Mac route

- `ios-ship install` clones main, builds Release, signs it for development, and installs it with `xcrun devicectl device install app`.
- `tools/ios-ship.json` lists the one app, Manifest. It holds no ID. The team, key and phone IDs live in the ios-ship account file on this Mac, off the repo.
- The phone is Shivinate XIII (owner ruling, 2026-10-26). `make phone` and `make testflight` call `ios-ship` with `tools/ios-ship.json --app Manifest`. The repo has no script or app list of its own.
- The phone must be on home Wi-Fi or cabled. The tool logs under ~/Library/Logs/ios-adblock-reinstall. Exit 75 means the phone is unreachable.
- Any non-zero exit leaves the same commit for a manual dispatch of the `testflight` workflow, which needs the owner's go, see The CI workflow. The report names the route that landed.
- First run: 2026-10-22 19:42 CDT, installed and launched over Wi-Fi.

## Native files

A TestFlight install puts a native build on the phone. So the first install is the first native ship, and the names in `native-files-are-frozen` freeze then.

## Unmeasured

- Every TestFlight build on the team expired together at 2026-10-22 08:11 CDT, across six apps. The cause is unknown.
- From the home repo, measured there and not here: a clean runner signs with the ASC key alone, with no certificate secret. Each run likely adds one Apple Development certificate.

## See also

- `build-and-deploy` — the steps and flags behind `ios-ship testflight`.
- `native-build-lanes` — lane N11, the device check, runs on the TestFlight build.
- `assets-and-icons` — the icon source and the archive check.
- `native-swift-rebuild` — the signing team and the bundle id.
- `native-files-are-frozen` — the file names that freeze at the first ship.
