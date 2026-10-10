# Boot seeds the remote after the mount

`boot()` seeds `opts.remote` after the app mounts. Then it runs `foreground()` with the away clock untouched. Most fixtures mean exactly that. The other device pushed at some point since. A cold mount counts as a fresh session. So a remote seeded before the mount would auto-merge away the conflict that the fixture exists to produce.

**Holds while:** `boot()` in `test/harness.mjs` seeds `opts.remote` after mounting, and `opts.remoteAtBoot` seeds the remote before it.

`opts.remoteAtBoot` is the explicit before-mount form. Group 40 uses it for the cold-start assertions. The change needed no call sites to move. It is also a more faithful model of the wire.

## See also

- `ruled-head-hand-elapsed-forward`, the signal a cold mount starts with.
- `ruled-head-resume-is-reopening`, the resume that a fresh mount counts as.
- `harness-drives-resume-by-event`, the other way tests reach a resume.
