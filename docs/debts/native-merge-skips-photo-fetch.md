# Nothing fetches native photos before an apply

**What.** `PhotoSync.pull` downloads the blobs that a ledger names, and it has no caller. On web, `pull-fetches-photos-before-apply` makes a merge or a held reply fetch its photos first. A native apply that skips the call lands the ledger with no blobs, and a tile stays blank until a later sync brings the blob. The ids are kept either way. The gap closes when the native apply path calls `PhotoSync.pull` before it applies, and a test pins that order.

**Status:** open. Page item 59 (owner, 2026-11-08 15:23 CST) gives it to lane pins. No test or code exists yet; the work stopped for the cloud move.

**Plan.** `SyncClient` gains `photoSync: PhotoSync?`. Both the GET flow and the POST flow call `photoSync.pull(referenced:)` after the photo-id keep step and before the press gate and the apply. The ids are those of the reply's live envelopes. With no ids there is no call. A photo failure never changes the outcome or `advisory` (`photo-errors-never-hit-pushstate`). `PhotoSync.run` returns an empty report while another run is in flight, so a fetch during a push is skipped. The id is kept, and a later sync brings the blob. The order pin is a fake transport whose `get()` records that the store does not yet hold the reply's envelope. Its mutant moves the fetch after the apply. `LedgerStore.swift` is closed to lane pins, so the raw-reply id helper lives outside it, a stated duplicate of `photoIDs()`.

**Decision:** `pull-fetches-photos-before-apply`.
