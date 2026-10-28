# The native Orphaned composer audits flag text with no element

**What.** The native Orphaned view paints from `shared/tokens.json` through `OrphanedPaint`, and a unit test pins the meanings (`orphaned-colours-by-meaning`). Its three accessibility audits passed in the full suite at `c596d83`. The "Contrast failed" flag on the Edit, Discard and Cancel mini buttons is skipped by owner ruling (`audit-skips-measured-flags`). One finding remains open: an intermittent "Potentially inaccessible text" with no element and a zero frame in both composer audits, in 3 of 5 runs on 2026-10-27 with the field focused by code, and in 0 of 1 with no autofocus. The full suite run on the lane head did not show it. It is not classified. The gap closes when its cause is found.

**Status:** open: the intermittent composer finding is unclassified.

**Decision:** `orphaned-colours-by-meaning`.
