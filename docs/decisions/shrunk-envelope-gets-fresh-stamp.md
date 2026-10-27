# A shrunk envelope gets a fresh stamp

A partial assignment leaves some entries behind, so the envelope shrinks. The assignment then sets `updatedAt` to the current time. Without that stamp, the other device's larger, stale copy would win the merge. It would bring back the entries just checked in. A full assignment writes a tombstone instead. It sets `deletedAt` and `updatedAt`, so a stale copy cannot bring the envelope back. See `envelope-deletion-unrepresented`.

**Holds while:** the assign handler in `src/app.jsx` sets `updatedAt: Date.now()` on the leftover branch, and `mergeEnvelopes` in `src/merge-rules.mjs` keeps the copy with the larger `updatedAt`.

**Pinned by:** group 34, tests 34.26 to 34.28. Test 34.26 checks that a partial assignment leaves the envelope behind. Test 34.27 checks that the stamp makes the remote's stale copy lose. Test 34.28 checks that the checked-in entry does not come back. Mutant confirmed red: assignment no longer stamping `updatedAt`.

## See also

- `envelope-deletion-unrepresented` — the full-assignment case, which leaves a tombstone
- `merge-later-change-wins` — the merge rule this stamp relies on
- `undo-removes-only-its-delta` — the other write an assignment makes
