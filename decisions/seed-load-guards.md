# The seed never overwrites a keyed device

The load path carries two guards, and the second matters more. The seed never overwrites an existing ledger, and it never runs on a device that already holds a key. A keyed device belongs to the owner. Hydrating a stale build-time snapshot over cleared owner storage would put stale data under a live sha, which auto-push would then publish. A keyed device recovers by pulling instead. The seed is a snapshot, not a feed, and it refreshes only on the next deploy.

## See also

- `the-public-seed` — what these guards protect a keyed device from
- `check-seed-backstop-not-proof` — the check that verifies what the seed publishes
