# The Ledger tab holds the options

The owner ruled on 2026-10-11: "E for sure". The bar in `phone-nav-is-bottom-bar` gets a fourth tab, Ledger, with a gear icon. The working screens lose their control rows. The Ledger tab holds the options in two groups.

**Status:** ruled, not built.

**Holds while:** the working screen of `src/app.jsx` renders the Orders from, Showing, Sorted by and Find cells, and the bar is ruled as in `phone-nav-is-bottom-bar`.

## The Ledger tab

**View**

- Showing (unreceived).
- Sorted by.
- Orders from.

**Data**

- Sync.
- History.
- Re-import CSV.

Reset sits last, in red, in its own box.

The sync advisory line still shows on the working screen. It shows only when something is wrong.

Find is not in the Ledger tab. It is a floating search field above the bar, as `phone-nav-is-bottom-bar` rules.

## Defaults and invariants

- Backup sits in the Data group, after Re-import CSV. This is an orchestrator default of 2026-10-11, because Backup is a data action.
- The Ledger tab, Re-import CSV and Reset stay reachable on an empty ledger. `recovery-control-not-state-gated` requires it, so this needs no new ruling.
- The look of the Ledger screen is not ruled.

## See also

- `phone-nav-is-bottom-bar` — the bar that holds the Ledger tab.
- `recovery-control-not-state-gated` — the rule that Reset and Re-import must stay reachable.
- `ruled-head-showing-unreceived` — the Showing control, now in the Ledger tab.
- `history-sync-close-each-other` — History and Sync, now in the Ledger tab.

## Records that change when lane L11 builds

These still put the controls on the working screen, which is true until L11 ships. L11 rewrites them in place: `action-row-is-ruled-cells`, `armed-reset-takes-the-row`, `ruled-head-showing-unreceived`, `history-sync-close-each-other`, `sync-panel-is-two-column-grid` and `ruled-head-one-advisory-entrance`.
