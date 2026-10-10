# Undo removes only its own delta

Undo keeps the deltas of an assignment, not a snapshot of the ledger. For each card, undo subtracts what the assignment took. If the user hand-edited a card after the assignment, that edit survives the undo. A snapshot restore would erase it. A key that falls to zero is deleted, not stored as 0. The envelope returns to its place in the pile.

**Holds while:** `undoAssign` in `src/app.jsx` subtracts the takes in `undo.plan` from `received`, and `setUndo` records the plan rather than a copy of `received`.

**Pinned by:** groups 5 and 14. Test 5.2 checks that a key is deleted, not zeroed. Test 14.3 checks that undo removes only its own delta. Test 14.5 checks that the hand edit survived. Mutant confirmed red: undo restoring a snapshot instead of subtracting its own delta. Group 14 exposes it, because only a hand edit made before the undo tells the two apart.

## See also

- `orphaned-mail-never-decides` — the assignment that undo reverses
- `shrunk-envelope-gets-fresh-stamp` — the other write an assignment makes
- `testing-partial-qty-needs-case` — the partial-quantity case that assignment needs
