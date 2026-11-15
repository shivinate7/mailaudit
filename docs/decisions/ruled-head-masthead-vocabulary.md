# The ruled head continues the masthead

Kind: build

Plan: docs/decisions/native-build-lanes.md#still-open (native)

The control region uses the masthead's own vocabulary. It has hairline rules and uppercase mono micro-labels over Cochin values. It has no boxes and no fills. The only fill is the accent that means "active" everywhere else in the app.

**Holds while:** `src/app.jsx` renders the head cells in the Ledger tab's View group, labels "Orders from" and shows a count of lines outside the range.

The head cells live in the Ledger tab's View group. Owner item 47, answer a, ruled that home on 2026-11-08 at 15:23 CST. The native app has no View group yet. Owner item 59 a, 2026-11-08, queued its build for the restyle lane, after step 10.

Three ruled cells report the state and say what changes it:

- **Showing** flips between `● Unreceived` and `○ Everything` on one tap.
- **Sorted by** opens a panel of options. The app has no `<select>`.
- **Orders from**: the active range. This cell also holds the only figure line in the row, `N lines · M outside`. The other two cells deliberately carry no figure. They would restate the masthead's own tallies, a hundred pixels above.

## See also

- `ledger-tab-holds-options` — the Ledger tab record that holds the View group.
- `native-ledger-tab-unbuilt` — the debt for the native View group that is not built yet.
- `ruled-head-panels-carry-no-fill` — the same vocabulary applied to disclosure panels.
- `ruled-head-one-advisory-entrance` — the one line that carries sync vocabulary instead.
