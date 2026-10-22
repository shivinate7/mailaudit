# Nothing fetches native photos before an apply

**What.** `PhotoSync.pull` downloads the blobs that a ledger names, and it has no caller. On web, `pull-fetches-photos-before-apply` makes a merge or a held reply fetch its photos first. A native apply that skips the call lands the ledger with no blobs, and a tile stays blank until a later sync brings the blob. The ids are kept either way. The gap closes when the native apply path calls `PhotoSync.pull` before it applies, and a test pins that order.

**Status:** open. `HTTPPhotoTransport` exists, but the app builds neither it nor a `PhotoSync`, so the call has nothing to run on. No lane row names the call. The owner names the lane.

**Decision:** `pull-fetches-photos-before-apply`.
