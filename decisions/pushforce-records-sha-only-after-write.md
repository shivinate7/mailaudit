# pushForce records the sha after the write

`pushForce` hands its looked-up sha to the PUT. It does not store that sha first. The rule exists because an earlier version called `saveRec({ sha })` before it wrote. That made the force the one remaining place that recorded a claim to hold bytes it had not written. When the PUT then failed, the device kept a current sha over stale data. The failure could come from being offline, from throttling, or from a 409 raised by racing the photo repo. The next auto-push was then accepted with no conflict raised. This is the same incident as the pull path, reached through the force path.

**Holds while:** `pushForce` in `src/entry.jsx` passes its sha to `push()`. `push()` saves the sha only after its PUT, and tests 35.6 and 35.7 cover this.

`push()` takes an optional sha override for this case. It records that sha only after the bytes reach GitHub.

Tests 35.6–35.7 pin this at the app level. The adapter is unreachable from the suite, so the mock was corrected to match. The mock had mirrored the same ordering. It had also cleared `remote.fail` on the way in. So a force could never fail, and nothing could catch this.

## See also

- `sha-accepted-only-after-apply` — the same rule reached through the pull door instead of the force door.
- `a-stale-push-conflicts-pull-gets-two-tap` — the conflict this rule keeps honest.
