# The ready Orphaned composer fails contrast on its card count and its Save

**What.** `testAccessibilityAuditOrphanedComposerReady` failed "Contrast failed" on 2 of 2 tries in duo-ui run 42653870499, job pro-ui-a, on main `9bafcad` plus one Makefile comment line (2026-11-09). It flags two elements: the "1 card" text, which has no id, and the ready Save envelope button (`orphaned-save`). The audit skips the disabled Save and the Cancel button by owner ruling (`audit-skips-measured-flags`). These two elements have no such ruling. Debt `native-orphaned-colours-unbuilt` covers a different finding: text with no element, which comes and goes. The gap closes when the colours change and the audit passes. Skipping either element does not close it.

**Status:** open. A designer, then a builder, change the colours (roadmap step `orphaned-composer-colours`).

**Assigned:** the mailaudit coordinator session.

**Fix by:** 2026-12-01.

**Decision:** `orphaned-colours-by-meaning`.
