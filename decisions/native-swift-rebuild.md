# MANIFEST is rebuilt as a native Swift client

**Status:** ruled. The owner ruled on 2026-10-11: "Make it a mandate not a leaning. WE are rebuilding". No Swift code is built yet.

MANIFEST is rebuilt as a native Swift client. The work starts after the Cloudflare sync work lands. That work is stage 4b and the paste-key fix. The client talks to the same Cloudflare Worker, so the server and its merge rules carry over.

**Holds while:** no Swift client exists in this repo or a sibling repo. A Swift client that syncs through the Worker on the iPhone closes the build half. A ruling on the Mac side closes the rest.

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

## The Mac side

**Status:** open. The owner said the rebuild "maybe" does not fix the laptop side.

The MacBook runs the app in Safari. Safari keeps the 7-day rule, which counts days of Safari use (WebKit blog, "Full Third-Party Cookie Blocking and More", 2020). The key also sits on the shared origin there.

- **M1. Keep the Mac a web app.** No new cost. The Worker serves both clients. The Mac keeps the shared-origin key risk and the 7-day rule. Add to Dock gives the Mac page the web-app treatment (WebKit blog, "Updates to Storage Policy", 2023). Its effect on the 7-day rule is unknown.
- **M2. One SwiftUI app for iPhone and Mac.** The Mac gains the Keychain key and native storage. It costs Mac layouts and Mac testing in the same codebase. The web app would then serve only the public seed, and maybe retire.

## See also

- `sync-revamp-cloudflare` — the Worker the Swift client talks to
- `itp-may-clear-storage` — the eviction risk that native storage removes on the phone
- `a-host-migration-resets-storage` — the same reset a new app causes
- `token-sits-on-shared-origin` — the key risk that stays on the Mac under M1
- `live-verification` — the resume trigger that is still eye-only
- `nothing-recovers-without-the-key` — why the Keychain key matters
