# Envelope deletion is not represented

**Status:** open.

A discarded envelope carries no tombstone, so nothing tells "deleted here" apart from "created there" during a merge. A discarded envelope can therefore come back. The bias is deliberate: entries are hand typed and exist nowhere else. Resurrecting one costs a tap, while dropping one costs data the user actually typed. Stamps take the opposite bias, because a resurrected refund stamp would silently pull money back out of the tally.

## See also

- `orphaned-mail-never-decides` — the invariant this bias leans on
- `stamp-removal-writes-a-tombstone` — the opposite bias, and why stamps chose it
- `merge-rules-only-add` — the merge philosophy this asymmetry sits inside
