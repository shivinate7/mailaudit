# Envelope deletion is not represented

**Status:** open.

A discarded envelope has no tombstone. Nothing distinguishes "deleted here" from "created there" during a merge. So a discarded envelope can come back.

**Holds while:** `mergeEnvelopes` in `src/merge-rules.mjs` has no deletion marker. A deletion marker on envelopes closes this.

This bias is deliberate. Entries are hand typed and exist nowhere else. `orphaned-mail-never-decides` means that a stray envelope decides nothing on its own. So resurrecting one costs a tap. Dropping one costs data the user typed.

Stamps take the opposite bias, on purpose. A removed stamp is a tombstone, `kind: ""`. A resurrected `refunded` stamp would silently take money back out of the tally. A stamp is one value the user can re-set in two taps.

Tombstones and stamps orphaned by a changed seller string are never pruned. Both are a few bytes.

## See also

- `orphaned-mail-never-decides` — the invariant this bias leans on
- `stamp-removal-writes-a-tombstone` — the opposite bias, and why stamps chose it
- `merge-rules-only-add` — the merge philosophy this asymmetry sits inside
