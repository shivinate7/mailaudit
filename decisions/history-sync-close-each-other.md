# History and Sync close each other

**Status:** ruled 2026-10-11, not built. One point is open, see the armed Reset paragraph.

Opening History closes Sync. Opening Sync closes History. The two panels never stand open together. The range and sort cells work the same way.

**Holds while:** `src/app.jsx` sets `historyOpen` to false when the sync line is tapped, and sets `syncOpen` to false when the History cell is tapped.

Both panels run several hundred pixels tall, and both overlay the list. Two open overlays would sit over the same area. So one panel is open at a time.

An armed Reset does not close either panel. The 2026-10-11 ruling means that the arm no longer hides the History cell. Open: whether an armed Reset still hides an open History panel. The old code hid it while the arm lasted, and `historyOpen` stayed set. The ruling does not say. Test 36.3 pins that the Sync panel stays open under an armed Reset. That test still runs against the old code.

The sync line is not gated on Reset. It stays on screen, so an open Sync panel keeps its own close control.

## See also

- `sync-line-toggles-its-panel` — the sync line that opens and closes its panel.
- `armed-reset-takes-the-row` — the armed Reset, now arming in place.
- `ruled-head-panels-carry-no-fill` — the panel style both share, which conflicts with the overlay.
