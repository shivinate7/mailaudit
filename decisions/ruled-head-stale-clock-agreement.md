# The staleness clock measures agreement, not writes

The staleness clock is the last time this device agreed with the Worker. `syncedAt` is `workerSyncedAt`: the time of the last successful Worker reply, kept in the saved state so a reload keeps it. It never reads `pushedAt`, `pulledAt` or a GitHub peek (owner ruling 2026-10-12, default 5: the UI shows no GitHub state). That value is defined once. The decision, the line's copy and the Last sync row all read it.

**Holds while:** `syncedAt` in `src/app.jsx` is `workerSyncedAt`, and the save payload carries `workerSyncedAt`.

The clock measures agreement, not writes. A phone that only merges still agrees with the Worker, so it never reports itself stale. No agreement yet is a call in flight, or a failure that `serverDown` already raised. So there is no "never" state. `workerSyncedAt` is device-local: it is in the save payload and the load effect, and not in `snapshot()`, the backup or the merge.

**Pinned by:** 45.1–45.3. Staleness measured off `pushedAt` alone kills 45.1 and 45.2. Test 45.3 pins the ordering. A fresh `pulledAt` must never mask being behind. The `remoteInfo` effect keys on `[loaded, syncOpen]`. So a test must toggle the panel before it asserts. See `testing-check-something-rereads`.

## See also

- `ruled-head-one-advisory-entrance` — the line this clock feeds.
- `sha-accepted-only-after-apply` — the sha rule that keeps a pull honest about agreement.
- `pull-needs-a-key-too` — a case this clock must treat as broken sync.
