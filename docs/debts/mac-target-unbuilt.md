# The Mac has no native app

**What.** The native app builds for the iPhone only. `native/project.yml` builds one iOS app target, `Manifest`, with `TARGETED_DEVICE_FAMILY` 1, plus its UI test bundle. On the Mac, MANIFEST runs as the web app in any browser. In Safari its key has the 7-day rule and sits on the shared origin. The owner ruled that iPhone-only ships (owner, 2026-11-03 18:16 CST, Cockpit item 192 `iphone-only-vs-mac`, pick a). The gap closes when a Mac build of the SwiftUI app syncs through the Worker, and `native/project.yml` builds it.

**Status:** open. A Mac target is not scheduled.

**Decision:** `native-swift-rebuild`.
