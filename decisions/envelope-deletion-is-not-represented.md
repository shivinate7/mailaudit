# Envelope deletion is not represented

**Status:** open.

A discarded envelope carries no tombstone, so nothing tells "deleted here" apart from "created there" during a merge. A discarded envelope can therefore come back. The bias is deliberate: entries are hand typed and exist nowhere else. Resurrecting one costs a tap, while dropping one costs data the user actually typed. Stamps take the opposite bias, because a resurrected refund stamp would silently pull money back out of the tally.

## The thread, as recorded

```
- **Envelope deletion isn't represented, so a discarded envelope can come
  back.** Nothing distinguishes "deleted here" from "created there" without
  tombstones. The bias is chosen: entries are hand-typed and exist nowhere else,
  and invariant 7 means a stray envelope decides nothing on its own —
  resurrecting one costs a tap, dropping one costs data the user typed.
  **Stamps go the other way, deliberately:** a removed stamp is a tombstone
  (`kind: ""`), because a resurrected `refunded` stamp would silently take
  money back out of the tally, and a stamp is one value the user can re-set in
  two taps. Tombstones and stamps orphaned by a changed seller string are
  never pruned; both are a few bytes.
```

## See also

- `orphaned-mail-never-decides` — the invariant this bias leans on
- `stamp-removal-writes-a-tombstone` — the opposite bias, and why stamps chose it
- `merge-rules-only-add` — the merge philosophy this asymmetry sits inside
