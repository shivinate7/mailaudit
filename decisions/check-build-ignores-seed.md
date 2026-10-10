# The build check compares code, and ignores the seed

The committed page carries two things: the bundle, and a snapshot of the ledger read at build time. Only the bundle is a claim about the repository. The ledger snapshot changes on its own schedule between builds. Comparing whole pages would fail every time in continuous integration. It would also fail at random on a machine racing the phone's own sync. A check that cries wolf trains people to ignore the alarm. So the build check strips the seed from both sides before comparing.

## See also

- `check-seed-backstop-not-proof` — the other half of the same check, on what the seed publishes
- `the-public-seed` — the seed this check strips before comparing
- `ledger-remote-needed-for-seed-build` — why a build can come out seedless
