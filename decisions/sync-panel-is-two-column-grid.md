# The sync panel is server status, last sync and a key box

The sync panel has no option grid. L11b removed its GitHub controls (owner ruling 2026-10-12). The panel is the Sync group on the Ledger tab (`ledger-tab-holds-options`). It sits on the same surface as the other disclosures, `panelWrap`. See `ruled-head-panels-carry-no-fill`.

**Holds while:** the Sync panel in `src/app.jsx` renders a particulars grid, `partGrid`. Its rows are "Server", "Last sync", and "Sync key". The key row shows only when the Worker key state is known. Photo progress and remote notes can show above the grid while they last.

`syncActions` still builds the old GitHub actions in `src/app.jsx`. No render reads that array. The array is dead code. A builder should remove it.

The Auto-push cell is gone. Sync runs unconditionally now. See `sync-runs-itself`.

The sort and range panels still lay out cells with `optGrid`. Two columns are used for the sort panel, and four for the range panel. The odd-count rule still holds there: an odd last cell spans the row. Tests 47.3, 47.4 and 47.7 pin that rule on the sync grid. They are for a builder to re-point.

## See also

- `ledger-tab-holds-options` — the Sync group this panel belongs to.
- `sync-particulars-ruled-values` — the particulars under the panel.
- `sync-line-toggles-its-panel` — the line that opens this panel.
- `ruled-head-panels-carry-no-fill` — the panel surface this panel shares.
- `ruled-head-heights` — the measured height of the open panel.

**Pinned by:** 64.1 (the panel opens with the device key box), 64.2 (Save sync key is on screen), 64.3 to 64.6 (no Pull, Push, Merge or armed ask is on screen), 64.7 and 64.8 (an empty ledger still reaches the key box, with no Pull). No test pins the panel's rendered columns. jsdom has no layout.
