# Native photos are built but no screen or client calls them

**What.** Lane N10 built the photo kit in `native/ManifestKit` (downscale, store, capture, sync against a `PhotoTransport`, the id rule, the viewer model) and the views in `native/Manifest/PhotoViews.swift`. Nothing calls them yet:

- No `PhotoTransport` is built over HTTP (the Bearer header, the base URL, the 413 line). Lane N4a's client owns it.
- No screen shows `PhotoStrip`, `PhotoViewer` or `PhotoSyncBar`, and nothing calls `PhotoCapture.add`. The envelope card is lane N7's. The camera or picker control and its Info.plist usage string are not built.
- `PhotoIds.kept` has no caller. Lane N9 owes the restore call and lane N4a the server-apply call.
- A merge does not yet fetch photos before it applies, see `pull-fetches-photos-before-apply`.
- No orphan sweep runs, so a blob whose id could not be saved stays on disk, see `orphan-sweep-drops-unused-photos`.
- The VoiceOver focus move, the isModal trait and the Escape gesture are hand checks for lane N11.

The gap closes when those callers land.

**Status:** open. Waits for lanes N4a, N7 and N9.

**Decision:** `native-build-lanes`.
