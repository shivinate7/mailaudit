# The Ledger tab holds the options

The owner ruled on 2026-10-11: "E for sure". The bar in `phone-nav-is-bottom-bar` has a fourth tab, Ledger. The working screens hold no option rows. The Ledger tab holds the options.

The owner ruled on 2026-10-12, on GitHub sync: "i thought we are eliminating push and pull". The GitHub controls leave the UI. This follows the 2026-10-11 ruling "Cloudflare does it all" (`sync-revamp-cloudflare`).

**Status:** built in L11b, commit `12e8721`, on `web/l11-bottom-bar`. The look of the Ledger screen is not ruled.

**Holds while:** `src/app.jsx` renders the Ledger tab as a `section` labelled "Ledger options". The working screens render no option rows. The advisory line stays on the working screens.

## The Ledger tab

**View.** Shows only when the ledger holds items.

- Showing. Its value is `● Unreceived` or `○ Everything`.
- Sorted by.
- Orders from.

**Data.**

- Sync. Shows when this device has a remote or a Worker.
- History. Shows when the versions adapter or the remote exists.
- Re-import CSV.
- Backup. Backup + photos shows as well when photos exist.

**Reset.** Sits last, in its own box, in red. It arms in place (`armed-reset-takes-the-row`). It shows on an empty ledger.

Find is not in the Ledger tab. It is a floating search field above the bar, as `phone-nav-is-bottom-bar` rules.

## The Sync group

The Sync group shows three things:

- The server status, from the last Worker call.
- The last sync time.
- The device key box, with `Save sync key`.

It holds no GitHub control. It has no Pull, no Push, no Merge, and no armed ask.

The GitHub mirror push still runs in the background. `worker-keeps-snapshots` replaces it. The mirror code stays. A GitHub conflict waits for the mirror to resolve it. No button resolves it.

## Defaults and invariants

- Backup sits in the Data group, after Re-import CSV. This is an orchestrator default of 2026-10-11, because Backup is a data action. The owner's mockup G, approved on 2026-10-11, has no Backup row.
- The Ledger tab, Re-import CSV and Reset stay reachable on an empty ledger. `recovery-control-not-state-gated` requires it. The View group hides on an empty ledger, under the narrower gate that the filters keep.
- The Ledger tab holds the Sync and History rows inside the Data group. This record keeps that grouping.
- The count and Cancel default for Pull's ask and Push anyway's ask no longer applies. Both asks left the UI on 2026-10-12.
- The advisory line goes to the Ledger tab. It opens the Sync group and closes History (`ruled-head-one-advisory-entrance`).

## See also

- `phone-nav-is-bottom-bar` — the bar that holds the Ledger tab.
- `recovery-control-not-state-gated` — the rule that Reset and Re-import stay reachable.
- `ruled-head-showing-unreceived` — the Showing row, now in the View group.
- `history-sync-close-each-other` — History and Sync, both in the Ledger tab.
- `armed-reset-takes-the-row` — how Reset arms in place.
- `sync-panel-is-two-column-grid` — the Sync group's panel.
- `worker-keeps-snapshots` — the Worker that replaces the GitHub mirror.

**Pinned by:** 63.1 to 63.26 (group 63: the Ledger tab's groups, its gates on an empty ledger, the armed Reset, and the advisory line's route). 64.1 to 64.8 (group 64: the Sync group holds no GitHub control).
