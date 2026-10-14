# History and Sync close each other

Kind: process

Home: decisions/history-sync-close-each-other.md

**Status:** ruled 2026-10-11, built in L11b, commit `12e8721`. One point is an orchestrator default, not an owner ruling: an armed Reset does not close either panel.

Opening History closes Sync. Opening Sync closes History. The two panels never stand open together. The Sorted by and Orders from panels close each other the same way.

**Holds while:** `src/app.jsx` sets `historyOpen` to false when the Sync row is tapped. It sets `syncOpen` to false when the History row is tapped. The advisory line sets `historyOpen` to false and `syncOpen` to true.

Both panels run several hundred pixels tall, and both overlay the list. Two open overlays would sit over the same area. So one panel is open at a time.

An armed Reset does not close either panel. The orchestrator default is that it does not. It follows the owner's "Fix both" on press movement (`armed-reset-takes-the-row`).

The Sync row is not gated on Reset. An open Sync panel keeps its own close control, the Sync row.

## See also

- `ledger-tab-holds-options` — both panels sit in the Ledger tab.
- `sync-line-toggles-its-panel` — the sync line. Its current behaviour is not checked here.
- `armed-reset-takes-the-row` — the armed Reset, arming in place.
- `ruled-head-panels-carry-no-fill` — the panel fill both share. An overlay takes the paper fill (orchestrator default).

**Pinned by:** 63.12 (opening History closes an open Sync), 63.13 (History is open after the tap), 63.26 (an armed Reset leaves History open). Debt: `reset-leaves-sync-unpinned`.
