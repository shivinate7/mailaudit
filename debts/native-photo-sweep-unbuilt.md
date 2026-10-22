# The native client has no photo sweep

**What.** Nothing on native removes a blob that no envelope or draft uses. `PhotoStore.remove` exists, and it has no caller. A discard already empties an envelope's photo ids with `discardEnvelope` and leaves the blobs on disk. A blob whose id could not be saved stays too, because `PhotoCapture.add` leaves it for the sweep. The web sweep in `orphan-sweep-drops-unused-photos` holds off while an undo is live or a composer is open. The gap closes when a native sweep exists with those two guards, and tests pin it.

**Status:** open. No lane owns it. The owner names the lane.

**Decision:** `orphan-sweep-drops-unused-photos`.
