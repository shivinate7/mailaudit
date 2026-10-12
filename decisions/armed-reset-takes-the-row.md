# An armed Reset arms in place

Reset is red text at rest. Armed, it shows a red fill and the words "Tap again to clear N cards". N counts every card the Reset clears, ledger cards and envelope cards both. Cancel joins the arm and takes first focus. The arm must keep the other two cells in place.

The count and the first focus on Cancel are an orchestrator default of 2026-10-11, not an owner ruling. The house rule ux-ask-or-undo asks for both. Both are built. The native reset ask in lane N9 also names its count and has Cancel (`native-build-lanes`).

**Status:** ruled 2026-10-11. Built: the count, Cancel and first focus. Not built: the in-place arm. The owner ruled under press movement, "Fix both": Reset arms in place and does not collapse the action row. Today the code collapses the row. Re-import and History step out for the four seconds the arm lasts. That is the old behaviour. The in-place arm is the next lane.

**Holds while:** `src/app.jsx` shows "Tap again to clear N cards" on the armed Reset. N is the ledger cards plus the live envelope cards. The arm clears after 4000 ms. The armed row sets Cancel to its content width and the ask to the rest, so the count is not cut off. That width is not re-measured here.

The arm must not move any other element. This applies the house rule ux-press-moves-nothing. Until the in-place lane lands, the collapse breaks that rule.

Today the arm still hides the two neighbouring cells, so a mis-tap cannot land on them. The in-place arm removes that protection. Whether a mis-tap on a neighbouring cell is safe is unmeasured.

Discard already arms in place (`orphan-entry-takes-one-input`). It is the pattern this record asks for.

**Pinned by:** tests 36.1 to 36.4 pin the old takeover. A builder lane rewrites them. Tests 61.4, 61.41 and 61.42 pin the count.

## See also

- `action-row-is-ruled-cells` — the row the arm stays in.
- `no-native-dialogs` — the two-tap pattern that a destructive control uses.
- `ruled-head-heights` — the measured width of the armed row, to re-measure.
- `ux-house-rules-govern` — the house rules this record applies.
