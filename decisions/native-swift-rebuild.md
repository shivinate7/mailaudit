# MANIFEST is rebuilt as a native Swift client

**Status:** ruled. The owner ruled on 2026-10-11: "Make it a mandate not a leaning. WE are rebuilding". No Swift code is built yet.

MANIFEST is rebuilt as a native Swift client. The work starts after the Cloudflare sync work lands. That work is stage 4b and the paste-key fix. The client talks to the same Cloudflare Worker, so the server and its merge rules carry over.

**Holds while:** no Swift client exists in this repo or a sibling repo. A SwiftUI app for iPhone and Mac that syncs through the Worker closes the build. The web app stays beside it.

## Why the web app is not enough on the iPhone

On 2026-10-11 a key delivered by QR reached Safari on the iPhone, but not the home-screen app. The home-screen app keeps separate storage. So a QR rescan does not reliably recover a key on the phone. The owner said a sync problem in the web app is "even more reason for the iphone side to be swift native".

## What native changes, per problem

Every claim below rests on an Apple or WebKit source. None was measured on the owner's phone.

- **Key storage.** Native fixes this. The key goes into the Keychain, not into web storage. Use the class "after first unlock, this device only", which Apple recommends for items "accessed by background applications" (Apple, Security). The app owns its storage, so key delivery cannot land in the wrong store. No other `shivinate7.github.io` page can reach the key, see `token-sits-on-shared-origin`.
- **The 7-day storage eviction.** Native removes this risk. The rule deletes website data, such as IndexedDB and LocalStorage (WebKit blog, "Full Third-Party Cookie Blocking and More", 2020). A native app keeps its ledger in its own files, so the rule does not apply. A WKWebView shell would not get this gain, because ITP is on by default in every WKWebView app (WebKit blog, "App-Bound Domains", 2020).
- **Background sync while the app is closed.** Native makes it possible, but not timely. A refresh task gets "up to 30 seconds" at a time the system picks (Apple, "Choosing Background Strategies for Your App"). Apple promises only that the task will not start before its date (Apple, `BGTaskRequest.earliestBeginDate`). A background push can wake the app, but Apple rate-limits pushes sent more than three times per hour (same Apple page). That push also needs APNs keys on the Worker. A web app gets neither, because WebKit says Web Push "is not an invitation for silent background runtime" (WebKit blog, "Meet Web Push", 2022).
- **Socket loss in the background.** Native does not fix it. Apple says "the system suspends your app shortly after the user moves it to the background" (TN3151, "Choosing the right networking API"). The fix stays a reconnect and one GET on resume. Native gives a certain resume callback. `live-verification` lists the web trigger as eye-only.
- **Camera access for envelope photos.** Nothing is broken today. The web app uses `<input capture="environment">` in `src/app.jsx`. A native app must declare `NSCameraUsageDescription`, which Apple requires for any app that uses the camera (Apple, Bundle Resources).

## What the rebuild must keep

- The Worker's merge, its keys and its WebSocket stay as they are, see `sync-revamp-cloudflare`. The Worker runs the same merge for every client.
- The client must build each item key exactly as the parser does, see `saved-state-shape`.
- Every invariant that touches data must hold in the Swift client too. These are `imports-merge-never-replace`, `saved-state-shape` and `the-token-is-a-credential`.
- Signing works on this Mac with `xcodebuild -allowProvisioningUpdates DEVELOPMENT_TEAM=SFYDZG48BE CODE_SIGN_STYLE=Automatic`. Its profiles last one year. Nightly installs use the phone-apps list in the ios-adblock repo.

## Costs the rebuild accepts

- A second client codebase. The web app is about 6,500 lines, with its own behaviour suite. The Swift client needs its own tests for the merge-facing rules.
- A one-time move of the phone's data. The new app starts empty, as in `a-host-migration-resets-storage`. The Worker restores the check-ins. The local versions do not come back. Photos come back only if the client reads them from their store.

## The Mac side: Degen's pattern

The owner ruled on 2026-10-11 to follow the Degen repo's D32, "Native SwiftUI app beside the web app". So the Mac gets the same SwiftUI app as the iPhone, and the web app stays.

- One SwiftUI target that builds for both iOS and macOS, and a Swift package for the client logic.
- Never build a feature twice. Degen's owner rule: "never copy or redo stuff on one side and the other individually unless if its web-only and native-only stuff".
- A parity table gives each feature one row, with a web test, a native test, and a scope of both, web-only or native-only.
- The Worker is the one home of the merge. The Swift client sends its changes and renders the reply. So `src/merge-rules.mjs` is never ported to Swift.
- The palette tokens and the test fixtures are shared files, built for both clients.
- The web app stays for the public seed and for any browser.

The Mac gains the Keychain key and native storage. In Safari it had the 7-day rule, which counts days of Safari use (WebKit blog, "Full Third-Party Cookie Blocking and More", 2020). Its key also sat on the shared origin. The cost is a parity table to keep, and a shared-token build step.

Rejected: Swift on the iPhone only, because the Mac keeps both web risks. One SwiftUI app with the web app retired, because it drops the browser fallback and the live web suite.

## See also

- `sync-revamp-cloudflare` — the Worker the Swift client talks to
- `itp-may-clear-storage` — the eviction risk that native storage removes on the phone
- `a-host-migration-resets-storage` — the same reset a new app causes
- `token-sits-on-shared-origin` — the key risk that the SwiftUI app closes on both devices
- `live-verification` — the resume trigger that is still eye-only
- `nothing-recovers-without-the-key` — why the Keychain key matters
