# Auto-push is safe only because merge exists

Automating the push without the merge rule (`merge-rules.mjs`) would turn the conflict trap from something hit occasionally into the normal way two devices meet. Without a Worker key, auto-push therefore refuses to write when `peek()` cannot see the remote. Pushing on an unknown remote state is exactly how one device overwrites the other. With a Worker key, auto-push skips `peek()`. The Worker holds the shared ledger and merges it itself, so the GitHub write is a mirror. A stale sha there is re-read and written again, through `pushForce`.

**Holds while:** with no Worker key, `autoPush` in `src/app.jsx` returns early unless `peek()` reports `known`. With a key, `autoPush` takes the mirror path and never calls `peek()`. `src/merge-rules.mjs` exports `mergeLedger`, and `worker/core.mjs` calls it too.

**Pinned by:** group 34, on a device with no Worker key. Test 34.18 asserts that auto-push refuses to write when it cannot look. Test 34.23 asserts that a conflict during an unattended push resolves by merging. Mutants confirmed red: auto-push reading an unreadable remote as all clear (34.18), and auto-push leaving a conflict rather than merging it (34.23). Group 54 pins the keyed path: test 54.1a (no peek) and test 54.3 (a stale sha is forced).

## See also

- `merge-later-change-wins` — the merge rule that makes auto-push safe
- `push-and-merge-guard-differently` — why the push and the merge guard on different states
- `two-device-merge-proven-first` — the conflict test to run before trusting this
