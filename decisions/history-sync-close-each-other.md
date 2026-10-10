# History and Sync close each other

History and Sync close each other. Opening one closes the other, as the range and sort cells already do.

**Holds while:** `src/app.jsx` sets `historyOpen` to false when the sync line opens, and sets `syncOpen` to false when History opens.

Both panels run several hundred pixels tall. Stacked, they push the packages off the screen.

An armed Reset closes both panels. Reset already hides the cells that open them. Leaving the panels open with no control to close them is the same one-way door as the sync line.

## See also

- `sync-line-toggles-its-panel` — the sync line that opens and closes its panel.
- `armed-reset-takes-the-row` — the armed Reset that closes both panels.
- `ruled-head-panels-carry-no-fill` — the panel style both share.
