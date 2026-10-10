# The seed never overwrites a keyed device

The load path carries two guards. The second matters more.

**Holds while:** the seed loads in `src/app.jsx` only when `!value` and the remote status has no `hasKey`.

- The seed never overwrites an existing ledger (`!value`).
- The seed never runs on a device that has a key. A keyed device is one of the owner's. The seed is a build-time snapshot. Hydrating it over cleared owner storage would put stale data under a live sha. Auto-push would then publish it. A keyed device gets nothing here and recovers by pulling.

The seed is a snapshot, not a feed. It refreshes when you deploy. Group 38d confirmed all three guards by mutation.

The seed is gzipped and base64 encoded. The real ledger is ~250KB and deflates to 49KB inlined. `entry.jsx` inflates it with `DecompressionStream`, the same primitive the version store uses. So `app.jsx` never learns how the seed was packed.

## See also

- `the-public-seed` — what these guards protect a keyed device from
- `check-seed-backstop-not-proof` — the check that verifies what the seed publishes
