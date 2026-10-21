# The native sync client has no caller and no screen

**What.** Lane N4a built `SyncClient` in `native/ManifestKit`. Nothing in the app creates it or calls it. No screen shows its `advisory`, so the 401 and 413 lines that `native-parity-table` puts in both clients are not drawn. `SyncClient` calls `/ledger` only, so no photo route goes through it: PhotoTransport over HTTP and the PhotoIds.kept server-apply call do not exist. The gap closes when the app calls the client, a screen shows each line, and the photo calls exist.

**Status:** open. Lane N4b owns the wiring, the 401 and 413 lines, PhotoTransport and the PhotoIds.kept call. The orchestrator assigned them on 2026-10-21. This is a process assignment, not an owner ruling.

**Decision:** `native-reply-waits-generation`.
