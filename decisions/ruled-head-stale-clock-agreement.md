# The staleness clock measures agreement, not writes

The staleness clock is `workerSyncedAt`: the time of the last successful Worker reply. It is saved with the ledger state, so a reload keeps it. The clock never reads `pushedAt`, `pulledAt` or a GitHub peek. That value is defined once. The decision, the line's copy and the Last sync row all read it. This is an orchestrator default of 2026-10-12, not an owner ruling. See `ruled-head-one-advisory-entrance`.

**Holds while:** `src/app.jsx` sets `syncedAt = workerSyncedAt` once, and the save payload and the load effect carry `workerSyncedAt`.

The clock measures agreement, not writes. A phone that only merges still agrees with the Worker, so it never reports itself stale. No agreement yet is a call in flight, or a failure that `serverDown` already raised. So there is no "never" state. `workerSyncedAt` is device-local: it is in the save payload and the load effect, and not in `snapshot()`, the backup or the merge.

**Pinned by:**

- 66.3 and 66.4: Last sync shows after the first Worker agreement. After a reload it shows the same agreement.
- 45.3: a fresh `pulledAt` never masks being behind, so a behind device does not write over GitHub. This pins the mirror guard, not the clock.
- 45.1 and 45.2 were written for the GitHub clock. They read `pushedAt` and `pulledAt`, which the clock no longer reads. They need a re-point to the Worker clock. That is not done.

A test must toggle the Sync panel before it asserts. The `remoteInfo` status effect keys on `[loaded, syncOpen]` (`testing-check-something-rereads`).

## See also

- `ruled-head-one-advisory-entrance` — the line this clock feeds.
- `sha-accepted-only-after-apply` — the sha rule that keeps a pull honest about agreement.
- `pull-needs-a-key-too` — a GitHub key rule the clock does not read.
