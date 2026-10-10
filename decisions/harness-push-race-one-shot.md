# A push conflict needs a one-shot failure

`remote.fail` cannot express a push that conflicts. It rejects the pull as well. So the merge that recovers from the conflict never receives its payload. `remote.pushFailOnce` is the one-shot, push-only version.

**Holds while:** `remote.pushFailOnce` in `test/harness.mjs` is cleared after one push, and the pull path does not read it.

The one-shot models the real race. The remote moves between the `peek` and the `PUT`.

## See also

- `testing-mock-is-test-below-seam`, why the mock must match the real check.
- `stale-push-conflict-pull-two-tap`, the conflict this failure models.
- `two-device-merge-proven-first`, the merge that recovers from the conflict.
