# Auto-push is safe only because merge exists

Automating the push without the merge rule (`merge-rules.mjs`) would turn the conflict trap from something hit occasionally into the normal way two devices meet. Auto-push therefore refuses to write when `peek()` cannot see the remote. Pushing on an unknown remote state is exactly how one device overwrites the other.

## See also

- `merge-rules-only-add` — the merge rule that makes auto-push safe
- `push-and-merge-guard-differently` — why the push and the merge guard on different states
- `two-device-merge-must-be-proven-first` — the conflict test to run before trusting this
