# The native Orphaned composer audits flag text with no element

**What.** The native Orphaned view paints from `shared/tokens.json` through `OrphanedPaint`, and a unit test pins the meanings (`orphaned-colours-by-meaning`). Its accessibility audits passed in the full suite at `c596d83` (2026-10-27 18:50 CDT). An isolated run of 2026-10-27 15:51 CDT, on view and test files that match `c596d83`, failed all three composer audits. The "Contrast failed" flag on the Edit, Discard and Cancel mini buttons is skipped by owner ruling (`audit-skips-measured-flags`). One finding remains open: an intermittent "Potentially inaccessible text" with no element and a zero frame in both composer audits, in 3 of 5 runs on 2026-10-27 with the field focused by code, and in 0 of 1 with no autofocus. It is not classified. The gap closes when its cause is found.

**Status:** open, intermittent: the composer findings are unclassified, and whether main flakes the same way is unmeasured.

**Decision:** `orphaned-colours-by-meaning`.
