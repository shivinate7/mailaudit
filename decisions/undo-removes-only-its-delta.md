# Undo removes only its own delta

Undo keeps the deltas of an assignment, not a snapshot of the ledger. For each card, undo subtracts what the assignment took. If the user hand-edited a card after the assignment, that edit survives the undo. A snapshot restore would erase it. A key that falls to zero is deleted, not stored as 0. The envelope returns to its place in the pile, and the undo notice shows at that vacated slot, not at the top of the page.

A remote apply keeps the Undo bar and its plan, so Undo after a merge removes only its own change and keeps the other device's. Owner ruling 2026-10-21 13:30 CDT: "it should just be able to apply anyways why does the undo bar being open have to matter". See `auto-apply-happens-now`. A CSV import, a restore (a backup file or a saved version) and a Reset still clear the bar.

**Holds while:** `undoAssign` in `src/app.jsx` subtracts the takes in `undo.plan` from `received`, and `setUndo` records the plan rather than a copy of `received`.

Kind: build

Plan: decisions/undo-removes-only-its-delta.md#undo-removes-only-its-own-delta (web)

Plan: decisions/undo-removes-only-its-delta.md#undo-removes-only-its-own-delta (native)

**Pinned by:** groups 5, 14 and 75. Test 5.2 checks that a key is deleted, not zeroed. Test 14.3 checks that undo removes only its own delta. Test 14.5 checks that the hand edit survived. Mutant confirmed red: undo restoring a snapshot instead of subtracting its own delta. Group 14 exposes it, because only a hand edit made before the undo tells the two apart.
Test 75.13 checks that Undo after a remote apply removes only its own check-ins and keeps the other device's.

## See also

- `auto-apply-happens-now` — the remote apply that keeps the Undo bar
- `orphaned-mail-never-decides` — the assignment that undo reverses
- `shrunk-envelope-gets-fresh-stamp` — the other write an assignment makes
- `testing-partial-qty-needs-case` — the partial-quantity case that assignment needs
