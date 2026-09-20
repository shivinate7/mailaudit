# Push Force Records Sha After The Write

A forced push stores its looked-up sha only after the bytes actually reach GitHub, not before the write. Storing the sha first once let a failed forced write leave a current sha over stale data. The next automatic push then carried no conflict and overwrote the other device silently. Push now takes an optional sha override for exactly this case.

## The argument, as recorded

```
  **`pushForce` hands its looked-up sha to the PUT rather than storing it
  first.** It used to `saveRec({ sha })` before writing, which made the force
  the one remaining place recording a claim to hold bytes it had not written —
  and when that PUT then failed (offline, throttled, a 409 racing the photo
  repo), the device sat on a *current sha over stale data* and its next
  auto-push was **accepted with no conflict raised**. Verbatim the incident
  below, reached through the force door instead of the pull. `push()` takes an
  optional sha override for exactly this and records it only once the bytes are
  on GitHub. Tests 35.6–35.7 pin it at the app level; the adapter is unreachable
  from the suite, so the mock was corrected to match — it had mirrored the same
  ordering *and* cleared `remote.fail` on the way in, so a force could never
  fail and nothing could ever have caught this.
```
