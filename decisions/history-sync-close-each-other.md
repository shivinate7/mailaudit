# History and Sync close each other

Opening History closes Sync. Opening Sync closes History. The two panels never stand open together. The range and sort cells work the same way.

**Holds while:** `src/app.jsx` sets `historyOpen` to false when the sync line is tapped, and sets `syncOpen` to false when the History cell is tapped.

Both panels run several hundred pixels tall. Stacked, they push the packages off the screen.

An armed Reset does not close either panel. The Reset arm hides the History cell. It also hides the History panel while the arm lasts. `historyOpen` stays set, so the History panel returns when the arm clears. The sync line is not gated on Reset. It stays on screen, so an open Sync panel keeps its own close control. Test 36.3 pins that the Sync panel stays open under an armed Reset.

## See also

- `sync-line-toggles-its-panel` — the sync line that opens and closes its panel.
- `armed-reset-takes-the-row` — the armed Reset that hides the cells above.
- `ruled-head-panels-carry-no-fill` — the panel style both share.
