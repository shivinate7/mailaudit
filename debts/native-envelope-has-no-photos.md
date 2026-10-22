# Native envelopes have no photos

**What.** The native Orphaned view shows no photo and has no capture control. A new envelope is saved with an empty `photos` list, and an edit keeps the `photos` it finds. The web composer takes optional photos, see `orphan-entry-takes-one-input`. The envelope card and the composer in `native/Manifest/OrphanedView.swift` call none of the photo views of lane N10. The gap closes when both show the photo strip and a capture control, and a test pins it.

**Status:** open. Waits for the photo views and their callers from lane N10.

**Decision:** `orphan-entry-takes-one-input`.
