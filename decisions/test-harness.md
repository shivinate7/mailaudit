# How to drive the behaviour suite

This file holds the harness mechanics. It covers how `test/harness.mjs` mocks each platform API, and the list of gotchas. Read it before you write or fix a test.

## See also

- `suite-size`, the assertion count and run time for `npm test`.
- `testing-a-mock-is-the-test-below-the-seam`, why the mocks must stay honest.
- `remote-rules-fail-quietly`, why the remote mock enforces the sha check for real.
- `photo-sync-cannot-conflict`, the design the photo mock exercises.
