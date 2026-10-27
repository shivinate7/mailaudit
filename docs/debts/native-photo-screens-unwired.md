# No native screen shows a photo, and nothing takes one

**What.** Lane N10 built `PhotoStrip`, `PhotoViewer` and `PhotoSyncBar` in `native/Manifest/PhotoViews.swift`. No screen shows them. Nothing calls `PhotoCapture.add`, so no camera or picker control exists. Info.plist has no `NSCameraUsageDescription`, which `native-swift-rebuild` says a camera app must declare. No screen reads a `PhotoSyncReport`, so a photo over the cap and the lost-photo warning of `pull-warns-on-what-it-drops` are not shown. The app builds no `PhotoSync` on `HTTPPhotoTransport`, so no photo moves to or from the Worker. No lane row names an envelope card with photos. The gap closes when a screen shows the strip, the viewer, the Stop bar and the report, a control calls `PhotoCapture.add`, and the app runs a `PhotoSync` on `HTTPPhotoTransport`.

**Status:** open. No lane owns it. The owner names the lane.

**Decision:** `native-build-lanes`.
