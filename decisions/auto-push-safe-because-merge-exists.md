# Auto-push is safe only because merge exists

Automating the push without the merge rule would turn a conflict from something hit occasionally into the normal way two devices meet. Auto-push refuses to write when it cannot see the remote, because pushing on an unknown remote state is exactly how one device overwrites another.

## See also

- `merge-rules-only-add` — the merge rule that makes auto-push safe
- `push-and-merge-guard-differently` — why the push and the merge guard on different states
- `two-device-merge-must-be-proven-first` — the conflict test to run before trusting this
