# The native client has no photo sweep

**What.** Nothing on native removes a blob that no envelope or draft uses. `PhotoStore.remove` exists, and it has no caller. A discard already empties an envelope's photo ids with `discardEnvelope` and leaves the blobs on disk. A blob whose id could not be saved stays too, because `PhotoCapture.add` leaves it for the sweep. The web sweep in `orphan-sweep-drops-unused-photos` holds off while an undo is live or a composer is open. The gap closes when a native sweep exists with those two guards, and tests pin it.

**Status:** open. Page item 59 (owner, 2026-11-08 15:23 CST) gives it to lane pins. No test or code exists yet; the work stopped for the cloud move. The planned Kit shape is below.

**Plan.** A `@MainActor` `PhotoSweeper` in ManifestKit takes the photo store, the ledger store, a `held` check and a `syncing` check, and an injected sleep. `held` is true while an undo is live or a composer is open (`OrphanedModel.undo`, `OrphanedModel.composing`). `syncing` is a new `SyncClient.syncing` flag, true for a whole pull or push. `schedule()` checks both guards, sleeps 2000 ms, and checks both again when it fires (`photo-sweep-two-guards`). `sweepNow()` removes each held blob that `LedgerStore.photoIDs()` lacks, and does nothing when `heldIds()` is nil (`photo-ids-unreadable-local`). Native drafts hold no photos, so the keep set is the ledger's ids alone. The app needs one caller in `ManifestApp.swift`, and no grant covers it yet. The future caller of `PhotoCapture.add` must hold the composer guard, because a sweep between its `put` and its `commitPhoto` would delete the new photo.

**Decision:** `orphan-sweep-drops-unused-photos`.
