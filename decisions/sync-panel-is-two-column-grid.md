# The sync panel is a two-column option grid

The sync panel is an option grid of two columns. A block of particulars sits under the grid. It sits on the same surface as the date and sort disclosures, `panelWrap`. See `ruled-head-panels-carry-no-fill`.

**Holds while:** `syncActions` in `src/app.jsx` builds the panel's actions, and `optGrid(2)` lays them out.

The actions are data. They are built as `syncActions`, just above the component's `return`. The grid must know the count of actions. An odd last cell spans the whole row. Otherwise the rule colour shows through the empty half as a slab. The range panel uses the same trick.

The panel uses two columns everywhere, as the sort panel does. "Pull from GitHub" and "Tap again to replace" each need the 160px that half of 375px gives them. Neither fits a third column.

Each cell carries its own colour. The grid's one accent means "on". These cells mean different things:

- "Pushed ✓" uses green text.
- Merge uses an accent fill.
- Push anyway uses manila. It uses a manilaInk fill once armed.
- Pull uses a red fill once armed.

The Auto-push cell is gone. Sync runs unconditionally now. See `sync-runs-itself`.

Behind the sync line sit Push, Merge, Pull, Push anyway, the particulars and the key field.

**Pinned by:** 36.5–36.7. An odd last cell spans the row (36.5). Adding Backup + photos makes the second cell (36.6). An even count leaves every cell its own half (36.7). The first draft of group 36 booted against a seeded remote. That made the device behind. Behind adds a Merge cell, which turns three cells into four. So read the count off the screen, not off the fixture.

## See also

- `sync-particulars-ruled-values` — the particulars under the grid.
- `merge-is-the-primary-sync-action` — the colour and order of the Merge action.
- `sync-line-toggles-its-panel` — the line that opens this panel.
- `ruled-head-panels-carry-no-fill` — the panel surface this panel shares.
- `ruled-head-heights` — the measured height of the open panel.
