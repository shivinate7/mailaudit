# The iOS app ships through TestFlight

The MANIFEST iOS app reaches the owner's phone through TestFlight. A Release build is built and uploaded on this Mac after each merge. `make testflight` does both.

**Status:** ruled. Owner ruling, 2026-10-21 13:58 CDT, as the lane brief records it: "the MANIFEST iOS app ships to the owner's phone through TestFlight, as a Release build built and uploaded on this Mac after each merge". It replaces the planned cable install with `xcrun devicectl`. The make target is built on lane native/testflight. The first upload ran once on 2026-10-21 and failed, because the app record does not exist. Debt: `testflight-app-record-missing`.

Kind: build

Plan: decisions/build-and-deploy.md#make-testflight (native)

**Holds while:** `Makefile` has a `testflight` target that exports with `native/ExportOptions.plist`, and the owner installs MANIFEST on the phone from TestFlight.

## The command

- `make testflight` builds the rules bundle and the project, archives Release for `generic/platform=iOS`, then exports the archive to App Store Connect. The steps and flags are in `build-and-deploy`.
- `make archive` stops after the archive.
- Run it on this Mac after each merge. The recipe is shared with the owner's Degen project.
- The upload runs once. Never retry it in a loop.
- The App Store Connect API key file is a credential. Pass its path. Never read, copy or print it.

## The build number

- The build number is a UTC timestamp to the minute, set at archive time. It has 12 digits: year, month, day, hour, minute. The first archive got 202610211858.
- `make` passes it as `CURRENT_PROJECT_VERSION` on the `xcodebuild archive` command line. So every target in the archive gets the same number.
- `CFBundleVersion` in `native/Manifest/Info.plist` is `$(CURRENT_PROJECT_VERSION)`. `native/project.yml` sets the default to 1 for builds that are not archives.
- `ITSAppUsesNonExemptEncryption` is false in the same file.

## What it replaces

The ios-adblock repo's phone-apps list installs apps on the phone with `xcrun devicectl device install app`. MANIFEST does not join that list. The phone gets MANIFEST from TestFlight.

## Native files

A TestFlight install puts a native build on the phone. So the first install is the first native ship, and the names in `native-files-are-frozen` freeze then.

## Unmeasured

- The archive is signed with an Apple Development certificate, not a distribution one. Export is meant to re-sign it. Nobody has checked that.
- No upload has passed yet, so TestFlight processing is unmeasured.

## See also

- `build-and-deploy` — the steps and flags behind `make testflight`.
- `native-build-lanes` — lane N11, the device check, runs on the TestFlight build.
- `native-swift-rebuild` — the signing team and the bundle id.
- `native-files-are-frozen` — the file names that freeze at the first ship.
- `testflight-app-record-missing` — the owner step that blocks the first upload.
