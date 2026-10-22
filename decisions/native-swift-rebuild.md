# MANIFEST is rebuilt as a native Swift client

Kind: build

Plan: decisions/native-swift-rebuild.md#what-native-changes-per-problem (native)

Plan: decisions/native-swift-rebuild.md#what-the-rebuild-must-keep (web)

**Status:** ruled. The owner ruled on 2026-10-11: "Make it a mandate not a leaning. WE are rebuilding". No Swift code is built yet. The lanes and their order are in `native-build-lanes`.

MANIFEST is rebuilt as a native Swift client. The client talks to the same Cloudflare Worker, so the server and its merge rules carry over. The paste-key fix has landed. The Swift sync client waits for the stage 4b switch. Lanes that change only JavaScript, shared files or the Worker start first, see `native-build-lanes`.

**Holds while:** no Swift client exists in this repo or a sibling repo. A SwiftUI app for iPhone and Mac that syncs through the Worker closes the build. The web app stays beside it.

## Where each ruling lives

- `native-build-lanes` — the lanes, their tests and their order.
- `native-parity-table` — the scope of each feature.
- `rules-run-in-javascriptcore` — the view logic has one home, in JavaScript.
- `shared-tokens-and-fixtures` — one token file and one fixture set.
- `native-key-via-url-scheme` — how the key arrives with no typing.
- `native-ledger-is-raw-json` — how the client stores the ledger.
- `native-reply-waits-generation` — when the client applies a Worker reply.
- `native-files-are-frozen` — the native file names.
- `native-ci-on-hosted-macos` — the native CI job.
- `native-ships-via-testflight` — how a native build reaches the phone.
- `csv-import-stays-web` — CSV import is not in the native client.
- `worker-keeps-snapshots` — GitHub leaves the sync role.

## Platform defaults

The owner accepted these on 2026-10-11 with "all seem fine". They are Degen's defaults.

- The minimum is iOS 26 and macOS 26.
- The Mac app has no sandbox.
- The bundle id is dev.shivinate.manifest.
- There is no background refresh in v1. A resume GET covers the need.

## Why the web app is not enough on the iPhone

On 2026-10-11 a key delivered by QR reached Safari on the iPhone, but not the home-screen app. The home-screen app keeps separate storage. So a QR rescan does not reliably recover a key on the phone. The owner said a sync problem in the web app is "even more reason for the iphone side to be swift native".

## What native changes, per problem

Every claim below rests on an Apple or WebKit source. None was measured on the owner's phone.

- **Key storage.** Native fixes this. The key goes into the Keychain, not into web storage. Use the class "after first unlock, this device only", which Apple recommends for items "accessed by background applications" (Apple, Security). The app owns its storage, so key delivery cannot land in the wrong store. No other `shivinate7.github.io` page can reach the key, see `token-sits-on-shared-origin`.
- **The 7-day storage eviction.** Native removes this risk. The rule deletes website data, such as IndexedDB and LocalStorage (WebKit blog, "Full Third-Party Cookie Blocking and More", 2020). A native app keeps its ledger in its own files, so the rule does not apply. A WKWebView shell would not get this gain, because ITP is on by default in every WKWebView app (WebKit blog, "App-Bound Domains", 2020).
- **Background sync while the app is closed.** Native makes it possible, but not timely. A refresh task gets "up to 30 seconds" at a time the system picks (Apple, "Choosing Background Strategies for Your App"). Apple promises only that the task will not start before its date (Apple, `BGTaskRequest.earliestBeginDate`). A background push can wake the app, but Apple rate-limits pushes sent more than three times per hour (same Apple page). That push also needs APNs keys on the Worker. A web app gets neither, because WebKit says Web Push "is not an invitation for silent background runtime" (WebKit blog, "Meet Web Push", 2022). v1 has no background refresh, see Platform defaults.
- **Socket loss in the background.** Native does not fix it. Apple says "the system suspends your app shortly after the user moves it to the background" (TN3151, "Choosing the right networking API"). The fix stays a reconnect and one GET on resume. Native gives a certain resume callback. `live-verification` lists the web trigger as eye-only.
- **Camera access for envelope photos.** Nothing is broken today. The web app uses `<input capture="environment">` in `src/app.jsx`. A native app must declare `NSCameraUsageDescription`, which Apple requires for any app that uses the camera (Apple, Bundle Resources).

## What the rebuild must keep

- The Worker's merge, its keys and its WebSocket stay as they are, see `sync-revamp-cloudflare`. The Worker runs the same merge for every client.
- The client must build each item key exactly as the parser does, see `saved-state-shape`.
- Every invariant that touches data must hold in the Swift client too. These are `imports-merge-never-replace`, `saved-state-shape` and `the-token-is-a-credential`.
- The signing team is paid. It is not a free Personal Team, whatever Degen's spec says. The local profiles are valid from 2026-10-11 to 2027-10-11, and a paid team allows Associated Domains.
- Signing works on this Mac with `xcodebuild -allowProvisioningUpdates DEVELOPMENT_TEAM=SFYDZG48BE CODE_SIGN_STYLE=Automatic`. The phone gets the app through TestFlight, see `native-ships-via-testflight`.

## Costs the rebuild accepts

- A second client codebase. The web app is about 9,300 lines under `src/`, with its own behaviour suite (`wc -l src/*` on a1ad360). The Swift client needs its own tests for the merge-facing rules.
- A one-time move of the phone's data. The new app starts empty, as in `a-host-migration-resets-storage`. The Worker restores the check-ins. The local versions do not come back. Photos come back only if the client reads them from their store.

## The Mac side: Degen's pattern

The owner ruled on 2026-10-11 to follow the Degen repo's D32, "Native SwiftUI app beside the web app". So the Mac gets the same SwiftUI app as the iPhone, and the web app stays.

- One SwiftUI target that builds for both iOS and macOS, and a Swift package for the client logic.
- Never build a feature twice. Degen's owner rule: "never copy or redo stuff on one side and the other individually unless if its web-only and native-only stuff".
- A parity table gives each feature one row, with a web test, a native test, and a scope of both, web-only or native-only, see `native-parity-table`.
- The Worker is the one home of the merge. The Swift client sends its changes and renders the reply. So `src/merge-rules.mjs` is never ported to Swift.
- The view rules run in JavaScriptCore, so they have one home too, see `rules-run-in-javascriptcore`.
- The palette tokens and the test fixtures are shared files, built for both clients, see `shared-tokens-and-fixtures`.
- The web app stays for any browser and for CSV import, see `csv-import-stays-web`. The public seed is gone: the owner ruled it out on 2026-10-11, and `82e45d4` removed it, see `worker-keeps-snapshots`.

The Mac gains the Keychain key and native storage. In Safari it had the 7-day rule, which counts days of Safari use (WebKit blog, "Full Third-Party Cookie Blocking and More", 2020). Its key also sat on the shared origin. The cost is a parity table to keep, and a shared-token build step.

Rejected: Swift on the iPhone only, because the Mac keeps both web risks. One SwiftUI app with the web app retired, because it drops the browser fallback and the live web suite.

## See also

- `sync-revamp-cloudflare` — the Worker the Swift client talks to
- `itp-may-clear-storage` — the eviction risk that native storage removes on the phone
- `a-host-migration-resets-storage` — the same reset a new app causes
- `token-sits-on-shared-origin` — the key risk that the SwiftUI app closes on both devices
- `live-verification` — the resume trigger that is still eye-only
- `nothing-recovers-without-the-key` — why the Keychain key matters
