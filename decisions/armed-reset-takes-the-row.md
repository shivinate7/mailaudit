# An armed Reset arms in place

Reset is red text at rest, in its own box at the end of the Ledger tab. Armed, it shows a red fill and the words "Tap again to clear N cards". N counts every card the Reset clears: ledger cards and envelope cards. Cancel joins the arm and takes first focus. Cancel sits after Reset, so the Reset button does not move when the arm opens. The arm moves no other element.

The count and the first focus on Cancel are an orchestrator default of 2026-10-11, not an owner ruling. Cancel after Reset is an orchestrator default of 2026-10-12. The house rule ux-ask-or-undo asks for both. The native reset ask in lane N9 also names its count and has Cancel (`native-build-lanes`).

**Status:** ruled 2026-10-11. Built in L11b, commit `12e8721`: the in-place arm, the count, Cancel and first focus. The owner ruled under press movement, "Fix both". Reset arms in place and does not collapse any row. Cancel moved after Reset in L11c, commit `b62aebd`.

**Holds while:** `src/app.jsx` shows "Tap again to clear N cards" on the armed Reset. N is the ledger cards plus the live envelope cards. The shared `arm` helper clears the arm after 4000 ms. The armed box holds Reset, then Cancel, side by side. The count is not cut off. That width is not re-measured here.

A mis-tap on a control next to the armed box is unmeasured. The arm no longer hides the Data group.

Discard arms in place (`orphan-entry-takes-one-input`). It is the pattern this record asks for.

## See also

- `action-row-is-ruled-cells` — the rows the Reset box sits under.
- `ledger-tab-holds-options` — the Ledger tab that holds Reset.
- `no-native-dialogs` — the two-tap pattern that a destructive control uses.
- `ruled-head-heights` — the measured width of the armed row, to re-measure.
- `ux-house-rules-govern` — the house rules this record applies.

**Retired:** tests 26.18 (Pull arms) and 26.19 (the Pull arm disarming Reset), on 2026-10-12. The Pull arm left the UI.

**Pinned by:** 63.21 (the arm names the 14 ledger cards), 63.22 (the other cells stay in place), 63.23 (Cancel takes first focus), 63.24 (Cancel disarms, and nothing is cleared). 61.4 (the count), 61.41 and 61.42 (the count with envelope cards), and 65.8 (an armed Reset keeps its place, and Cancel sits after it).
