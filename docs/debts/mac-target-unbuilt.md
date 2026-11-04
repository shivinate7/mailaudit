# The Mac has no native app

**What.** The native app builds for the iPhone only. `native/project.yml` has one iOS target, `TARGETED_DEVICE_FAMILY` 1. On the Mac, MANIFEST runs only as the web app in Safari. There its key has the 7-day rule and sits on the shared origin. The owner ruled that iPhone-only ships (owner, 2026-11-03 18:16 CST, Cockpit item 192 `iphone-only-vs-mac`, pick a).

**Status:** open. A Mac target is not scheduled.

**Decision:** `native-swift-rebuild`.

**Retire.** A Mac build of the SwiftUI app syncs through the Worker, and `native/project.yml` builds it.
