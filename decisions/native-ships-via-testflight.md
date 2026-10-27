# The iOS app ships Mac first, TestFlight as the fallback

After each merge, this Mac installs a Release build of MANIFEST on the owner's phone over Wi-Fi or cable. `ios-ship install tools/ios-ship.json --app Manifest` does the install. If it fails for any reason, `make testflight` uploads the same commit to TestFlight at once.

**Status:** ruled. Owner ruling, 2026-10-22 19:40 CDT, for every app: when the phone is on Wi-Fi and the Mac can install, take that route, with TestFlight as the fallback. It amends the ruling of 2026-10-21 13:58 CDT, which shipped through TestFlight only.

Kind: build

Plan: decisions/build-and-deploy.md#make-testflight (native)

**Holds while:** the shared `ios-ship install` command installs a Release build from `tools/ios-ship.json`, and `Makefile` has a `testflight` target that exports with `native/ExportOptions.plist`.

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

## The app icon

The archive holds `Assets.car` and `CFBundleIconName` AppIcon, from the catalog in `native/Manifest/Assets.xcassets`. The round-1 review found the catalog missing, which App Store Connect rejects. The icon is the master, see `assets-and-icons`. Checked on a `make archive` of 2026-10-21 with `plutil`.

## The Mac route

- `ios-ship install` clones main, builds Release, signs it for development, and installs it with `xcrun devicectl device install app`.
- `tools/ios-ship.json` lists the one app, Manifest. It holds no ID. The team, key and phone IDs live in the ios-ship account file on this Mac, off the repo.
- The phone is Shivinate XIII (owner ruling, 2026-10-26). The `make phone` target and its one-app list file are removed.
- The phone must be on home Wi-Fi or cabled. The tool logs under ~/Library/Logs/ios-adblock-reinstall. Exit 75 means the phone is unreachable.
- Any non-zero exit sends the same commit through `make testflight`. The report names the route that landed.
- First run: 2026-10-22 19:42 CDT, installed and launched over Wi-Fi.

## Native files

A TestFlight install puts a native build on the phone. So the first install is the first native ship, and the names in `native-files-are-frozen` freeze then.

## Unmeasured

- Every TestFlight build on the team expired together at 2026-10-22 08:11 CDT, across six apps. The cause is unknown.

## See also

- `build-and-deploy` — the steps and flags behind `make testflight`.
- `native-build-lanes` — lane N11, the device check, runs on the TestFlight build.
- `assets-and-icons` — the icon source and the archive check.
- `native-swift-rebuild` — the signing team and the bundle id.
- `native-files-are-frozen` — the file names that freeze at the first ship.
