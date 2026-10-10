# An armed Reset takes the whole action row

Reset is red text at rest. Armed, it takes the whole action row.

**Holds while:** `src/app.jsx` shows the words "Tap again to clear everything" on the armed Reset, and it clears the arm after 4000 ms.

Armed, Reset shows a red fill and the words "Tap again to clear everything". The other two cells step out for the four seconds the arm lasts.

The target grows over the spot just tapped. It does not wrap onto a new line under that spot. The two controls a mis-tap could land on are not there to land on.

This is the better two-tap, not a compromise.

**Pinned by:** 36.1–36.4. An armed Reset takes the row (36.1). The other two cells step out (36.2). The open Sync panel stays put underneath (36.3). Disarming brings the cells back (36.4). Test 36.4b checks that the Sync cell is gone for good, not only shut.

## See also

- `action-row-is-ruled-cells` — the row this arm takes over.
- `no-native-dialogs` — the two-tap pattern that a destructive control uses.
- `ruled-head-heights` — the measured width of the armed row.
