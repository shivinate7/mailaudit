# An armed Reset arms in place

Reset is red text at rest. Armed, it shows a red fill and the words "Tap again to clear everything". The other two cells keep their places.

**Status:** ruled 2026-10-11, not built. The owner ruled under press movement, "Fix both": Reset arms in place and does not collapse the action row. Today the code collapses the row. The other two cells step out for the four seconds the arm lasts. That is the old behaviour.

**Holds while:** `src/app.jsx` shows the words "Tap again to clear everything" on the armed Reset, and it clears the arm after 4000 ms.

The arm must not move any other element. This applies the house rule ux-press-moves-nothing.

The old record kept the two neighbouring cells out of reach during the arm. That protection is gone. Whether a mis-tap on a neighbouring cell is safe is unmeasured.

**Pinned by:** no test for the new behaviour yet. Tests 36.1 to 36.4 still pin the old takeover. A builder lane rewrites them.

## See also

- `action-row-is-ruled-cells` — the row the arm stays in.
- `no-native-dialogs` — the two-tap pattern that a destructive control uses.
- `ruled-head-heights` — the measured width of the armed row, to re-measure.
