# A photo error never reaches pushState

The photo upload phase keeps its own status and its own error table. These are separate from the ledger's push state. The photo phase has its own state and its own copy table, `PHOTO_SAYS`. It must never write `pushState`. Until 2026-10-12, only `pushState === "conflict"` gated Push anyway, the force that overwrote the ledger. GitHub answers 409 to rapid successive Contents writes on one repo. If a throttled photo error reached the ledger's error path, the app would offer a force that silently discards another device's check-ins. Test 30.11 covers this.

**Holds while:** `src/app.jsx` keeps `PHOTO_SAYS` as the photo copy table. Test 65.1 forbids the Push anyway text on any screen.

**Pinned by:** 30.11. Its mutant lets a photo error escape into the ledger's error path. That would have armed Push anyway, and a slow upload could then arm a button that overwrites another device's ledger.

## See also

- `stale-push-conflict-pull-two-tap` — the sync rule this one protects.
- `photo-sync-cannot-conflict` — why a photo error is never a real conflict.
