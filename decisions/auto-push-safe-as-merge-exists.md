# Auto-push is safe only because merge exists

Automating the push without the merge rule (`merge-rules.mjs`) would turn the conflict trap from something hit occasionally into the normal way two devices meet. Auto-push therefore refuses to write when `peek()` cannot see the remote. Pushing on an unknown remote state is exactly how one device overwrites the other.

**Holds while:** `autoPush` in `src/app.jsx` returns early unless `peek()` reports `known`, and `src/merge-rules.mjs` exports `mergeLedger`.

**Pinned by:** group 34. Test 34.18 asserts that auto-push refuses to write when it cannot look. Test 34.23 asserts that a conflict during an unattended push resolves by merging. Mutants confirmed red: auto-push reading an unreadable remote as all clear (34.18), and auto-push leaving a conflict rather than merging it (34.23).

## See also

- `merge-rules-only-add` — the merge rule that makes auto-push safe
- `push-and-merge-guard-differently` — why the push and the merge guard on different states
- `two-device-merge-proven-first` — the conflict test to run before trusting this
