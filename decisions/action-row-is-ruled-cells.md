# The action row is retired, and its cells are ruled rows

**Status:** retired in L11b, commit `12e8721`. The working screens no longer hold the action row. Its cells are rows on the Ledger tab (`ledger-tab-holds-options`). The owner ruling of 2026-10-11 still applies: each cell has a 44px touch hit area, with no visual change. The rows set `min-height: 52px` in the `.mdl-lrow` style. No browser measure has been taken.

**Holds while:** `src/app.jsx` renders each Ledger tab option with `LedgerRow`, styled as `.mdl-lrow`. The `.mdl-acts` row and its `grid-auto-flow: column` rule are gone.

Each Ledger tab row shows its label and a sub line on the left. It shows its value in mono on the right. A row that opens a panel shows `aria-expanded`. A row that toggles a state shows `aria-pressed`. Re-import CSV and History carry the open state. The Reset row sits in its own box.

The Sync cell is gone from the working screens. The advisory line is the working screens' way to the Sync group (`ruled-head-one-advisory-entrance`). Re-import CSV and Reset keep the narrower gate. See `recovery-control-not-state-gated`.

## See also

- `ledger-tab-holds-options` — the rows this record now describes.
- `armed-reset-takes-the-row` — how an armed Reset arms in place.
- `recovery-control-not-state-gated` — why Re-import and Reset stay reachable.
- `ruled-head-one-advisory-entrance` — the line that leads to the Sync group.

**Pinned by:** 63.4 (the Ledger tab rows, in ruled order), 63.18 and 63.19 (Re-import CSV and Backup are reachable). No test pins the 44px hit area. jsdom has no layout.
