# A mock is the test below the seam

Below the seam an app-level test cannot reach, the mock stands in for the real defect. The `pushForce` sha bug lived in `entry.jsx`, in the entry-point adapter. No app-level test could catch it, and none can catch its return. Restoring the bad ordering leaves the suite green. That was verified.

**Holds while:** `pushForce` in `src/entry.jsx` sits below the app-level seam. Tests 35.6 and 35.7 in `test/app.test.mjs` pin the mock's ordering.

What the suite pins instead is the mock's faithfulness. Tests 35.6 and 35.7 pin it. That check is only as good as the mock. When a rule matters and lives below this seam, the mock is the test. Keep it honest. This mock had mirrored the bug, and it had disabled the only failure that could expose it. Keeping the mock honest is the only protection that layer gets.

**Pinned by:** groups 25 to 27. The mock enforces the sha check for real. `remote.sha` is what the remote holds. `remote.deviceSha` is what this device last saw. A stale push is rejected, the way GitHub would reject it. Seeding a remote without a pull is the second-device case. The HTTP round trip itself stays uncovered. See `remote-rules-fail-quietly`.

## See also

- `testing-mock-field-stops-decor` — another way a mock can hide a real defect
- `b64-fails-with-plausible-data` — the module family this seam sits below
