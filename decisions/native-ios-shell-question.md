# A native iOS shell is not worth building now

**Status:** open. This is a draft recommendation, and the owner has not ruled. No shell is built.

The question: would a thin native iOS app fix real problems that the home-screen web app has? The shell would wrap the live MANIFEST page in a WKWebView. It would keep the device key in the iOS Keychain, and run background sync with BGTaskScheduler. The paid Apple Developer Program is active, so signing is no longer a cost.

**Holds while:** no eviction or lost key has been seen on the iPhone, and the QR link delivers the key to the home-screen app. Either event reopens this question. So does a resume that iOS fails to report to the page.

## Each problem, and what a shell changes

Every claim below rests on an Apple source. None was measured on the owner's phone.

- **The 7-day storage eviction.** The shell does not fix it. ITP is on by default in every WKWebView app (WebKit blog, "App-Bound Domains", 2020). A home-screen web app already has its own day counter, and Apple does not expect its data to be deleted (WebKit blog, "Full Third-Party Cookie Blocking and More", 2020). So the shell adds no clear exemption. After the Cloudflare switch, an eviction also loses less. The Durable Object holds the ledger, so a wipe costs the key and the local versions, not the check-ins.
- **Background sync while the app is closed.** A thin shell cannot do it. A refresh task gets "up to 30 seconds" at a time the system picks (Apple, "Choosing Background Strategies for Your App"). Apple promises only that the task will not start before its date (Apple, `BGTaskRequest.earliestBeginDate`). The page's JavaScript does not reliably run in that window. So background sync needs native Swift storage, and then the shell is not thin. A silent web push is not an option either. WebKit says Web Push "is not an invitation for silent background runtime" (WebKit blog, "Meet Web Push", 2022). The app already catches up with one GET when it opens.
- **Socket loss in the background.** The shell does not fix it. Apple says "the system suspends your app shortly after the user moves it to the background" (TN3151, "Choosing the right networking API"). That holds for a native app too. The fix is the reconnect on resume, and PR #54 already has it on `visibilitychange`, `pageshow` and `online`. A shell gives one small gain. A native foreground callback is a certain resume trigger. `live-verification` lists the web trigger as eye-only.
- **Key storage.** The shell fixes this, on the phone only. The Keychain survives a web-storage wipe. Use the Keychain class "after first unlock, this device only", which Apple recommends for items "accessed by background applications" (Apple, Security). A shell that loads only this site also keeps other `shivinate7.github.io` pages away from the key, see `token-sits-on-shared-origin`. The MacBook still runs plain Safari, so the shared-origin risk stays there. The WebSocket sends the key as a subprotocol, so the key still enters page memory.
- **Camera access for envelope photos.** The shell does not fix it, because nothing is broken. The app uses `<input capture="environment">` in `src/app.jsx`, which works in the home-screen app today. A shell adds a cost here. The app must declare `NSCameraUsageDescription`, which Apple requires for any app that uses the camera (Apple, Bundle Resources).

## Options and their costs

- **A. Do nothing.** No cost now. The phone keeps the believed home-screen exemption. A lost key costs one QR rescan, and the Durable Object restores the ledger.
- **B. Ask for persistent storage. Recommended.** Call `navigator.storage.persist()` once, and show `persisted()` in the sync particulars. WebKit grants it "based on heuristics like whether the website is opened as a Home Screen Web App" (WebKit blog, "Updates to Storage Policy", 2023). The cost is a few lines in `src/entry.jsx` and one test. It also gives the first on-device answer for `itp-may-clear-storage`. On the Mac, Add to Dock gives the same web-app treatment ("Updates to Storage Policy").
- **C. A thin WKWebView shell with a Keychain key.** It gains the Keychain key and a certain resume trigger. It costs these:
  - A new app is a new data container. The ledger, the IndexedDB versions and the local photo blobs start empty, as in `a-host-migration-resets-storage`. The default data store "saves website data persistently to disk" for that app (Apple, `WKWebsiteDataStore`).
  - The shell must load the live Pages URL. A bundled page has a new origin, and the Worker allows only the listed origins.
  - A key bridge from Swift to the page, a second key source in `src/entry.jsx`, and its tests.
  - An Xcode project to keep. Signing works with `xcodebuild -allowProvisioningUpdates DEVELOPMENT_TEAM=SFYDZG48BE CODE_SIGN_STYLE=Automatic`. Its profiles last one year. Nightly installs use the phone-apps list in the ios-adblock repo.
- **D. A shell with native background sync.** Option C plus Swift code that fetches and stores the ledger outside the page. It needs native storage that the page must then read, or APNs keys on the Worker. Apple rate-limits background pushes sent more than three times per hour (Apple, "Choosing Background Strategies for Your App"). The gain is a ledger that is fresh a few seconds sooner on open.
- **E. A full Swift rewrite.** The orchestrator has rejected this. About 6,500 lines and their behaviour suite would need a second home.

## Recommendation

Take option B now. Do not build a shell. Of five problems, the shell clearly fixes one, key storage, and only on the phone. A QR rescan already recovers that loss. The shell also forces a storage reset and a second codebase.

Reopen this record if a trigger in **Holds while** occurs. Option C is then the step to take, not D.

## See also

- `itp-may-clear-storage` — the eviction risk that option B tests on a device
- `a-host-migration-resets-storage` — the same reset a new app container causes
- `token-sits-on-shared-origin` — the key risk that a shell closes on the phone only
- `live-verification` — the resume trigger that is still eye-only
- `sync-revamp-cloudflare` — the sync whose WebSocket and resume GET this record weighs
- `nothing-recovers-without-the-key` — why a lost key matters more than a lost ledger now
