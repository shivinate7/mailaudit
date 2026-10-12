# History and Sync close each other

**Status:** ruled 2026-10-11, not built. One point is an orchestrator default, not an owner ruling. See the armed Reset paragraph.

Opening History closes Sync. Opening Sync closes History. The two panels never stand open together. The range and sort cells work the same way.

**Holds while:** `src/app.jsx` sets `historyOpen` to false when the sync line is tapped, and sets `syncOpen` to false when the History cell is tapped.

Both panels run several hundred pixels tall, and both overlay the list. Two open overlays would sit over the same area. So one panel is open at a time.

An armed Reset does not close either panel. The 2026-10-11 ruling means that the arm no longer hides the History cell. The ruling does not say whether the arm still hides an open History panel. The orchestrator default (2026-10-11, not an owner ruling) is that it does not. It follows the owner's "Fix both" on press movement. The old code hid the panel while the arm lasted, and `historyOpen` stayed set. Test 36.3 pins that the Sync panel stays open under an armed Reset. That test still runs against the old code.

The sync line is not gated on Reset. It stays on screen, so an open Sync panel keeps its own close control.

## See also

- `sync-line-toggles-its-panel` — the sync line that opens and closes its panel.
- `armed-reset-takes-the-row` — the armed Reset, now arming in place.
- `ruled-head-panels-carry-no-fill` — the panel fill both share. An overlay takes the paper fill (orchestrator default).
