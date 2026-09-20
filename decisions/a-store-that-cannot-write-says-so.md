# A Broken Version Store Must Say So

When IndexedDB cannot be written, every version save must fail visibly instead of silently. A silent failure once let History report no versions saved, right before a Reset the app had promised was recoverable. The version list state now carries a distinct broken flag. A failed write also resets its own throttling window, instead of swallowing the next attempt too.

## The argument, as recorded

```
  **A store that cannot write says so.** `takeVersion` used to fail into an
  empty catch and `refreshVersions` used `.catch(() => [])`. With IndexedDB
  unavailable — private browsing, quota exhausted by the photo store, iOS
  storage pressure — every version failed silently, *including the
  `before reset` milestone*, and History then reported "No versions saved on
  this device yet": affirmatively wrong rather than merely unhelpful, since the
  ledger would then be destroyed by a Reset the app had promised was
  recoverable. `versionsDown` carries that now, a failed write resets the 30s
  gate rather than also swallowing the next window, and an unreadable list never
  renders as an empty one. Tests 38b.4–38b.5.
```

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the linked rule about staying reachable on failure.
- `milestones-are-taken-before-the-risk` — the milestone this failure could silently lose.
- `listphotos-is-three-valued` — the same three-valued shape applied elsewhere.
