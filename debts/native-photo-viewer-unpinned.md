# No test pins the photo viewer's traits or the Stop control

**What.** `PhotoViewerModelTests` pins the modal state and the focus that Escape and a tap return. No test pins what the SwiftUI view adds. These are the `isModal` trait, the VoiceOver focus move into the viewer and back to the tile, the Escape accessibility action, the 56pt tile size, and the 44pt Stop control in `PhotoSyncBar`. A `PhotoSync` test pins Stop itself. The gap closes when a UI test pins each one, or when the owner records each as a hand check in lane N11. The N11 row in `native-build-lanes` does not name them.

**Status:** open. It waits for a screen, see `native-photo-screens-unwired`.

**Decision:** `photo-thumbnails-and-viewer`.
