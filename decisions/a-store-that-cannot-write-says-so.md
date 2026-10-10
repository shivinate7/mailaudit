# A broken version store must say so

When IndexedDB cannot be written, every version save must fail visibly. It must never fail silently.

**Holds while:** `takeVersion` in `src/app.jsx` sets `versionsDown` in its failure branch, and `refreshVersions` never falls back to an empty list.

A silent failure once let History report "No versions saved on this device yet". That was wrong, not just unhelpful. It happened right before a Reset that the app had promised was recoverable. So the ledger would have been destroyed with no version to restore.

The cause was this. `takeVersion` failed into an empty catch. `refreshVersions` used `.catch(() => [])`. With IndexedDB unavailable, every version failed silently. This included the `before reset` milestone. Private browsing, quota exhausted by the photo store, and iOS storage pressure can all make IndexedDB unavailable.

Three rules hold now:

- The version list state carries a distinct broken flag, `versionsDown`.
- A failed write resets the 30s gate. It does not also swallow the next window.
- An unreadable list never renders as an empty one.

Tests 38b.4–38b.5.

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the linked rule about staying reachable on failure.
- `milestones-are-taken-before-the-risk` — the milestone this failure could silently lose.
- `listphotos-is-three-valued` — the same three-valued shape applied elsewhere.
