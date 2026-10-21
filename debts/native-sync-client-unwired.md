# The native sync client has no caller and no screen

**What.** Lane N4a built `SyncClient` in `native/ManifestKit`. Nothing in the app creates it or calls it. No screen shows its `advisory`, so the 401 and 413 lines that `native-parity-table` puts in both clients are not drawn. `SyncClient` calls `/ledger` only, so no photo route goes through it. The gap closes when the app calls the client and a screen shows each line.

**Status:** open. No lane owns the wiring. The owner names the lane.

**Decision:** `native-reply-waits-generation`.
