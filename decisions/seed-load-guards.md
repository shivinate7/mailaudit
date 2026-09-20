# The seed never overwrites a keyed device

The load path carries two guards, and the second matters more. The seed never overwrites an existing ledger, and it never runs on a device that already holds a key. A keyed device belongs to the owner. Hydrating a stale build-time snapshot over cleared owner storage would put stale data under a live sha, which auto-push would then publish. A keyed device recovers by pulling instead. The seed is a snapshot, not a feed, and it refreshes only on the next deploy.

## The argument, as recorded

```
Two guards in the load path, and the second is the one that matters:

- It never overwrites an existing ledger (`!value`).
- **It never runs on a device that has a key.** A keyed device is one of the
  owner's, and the seed is a build-time snapshot — hydrating it over cleared
  owner-storage would put stale data under a live sha, and auto-push would then
  publish it. A keyed device gets nothing here and recovers by pulling.

It is a snapshot, not a feed: it refreshes when you deploy. Group 38d, all three
guards mutation-confirmed. Gzip+base64 because the real ledger is ~250KB and
deflates to 49KB inlined; `entry.jsx` inflates it with `DecompressionStream`,
the same primitive the version store uses, so `app.jsx` never learns how the
seed was packed.
```
