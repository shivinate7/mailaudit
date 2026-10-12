# Three views share one switch

**Ruled, not built:** on phone, the bottom bar replaces this switch and adds a Ledger tab (`phone-nav-is-bottom-bar`). The empty-ledger rule below carries to the bar only once the owner rules it there.

The top of the app holds one switch. It moves between three views: Orphaned, Tally and Packages. The Tally and Packages views share one `received` map, the date filter, search and Showing.

**Holds while:** `src/app.jsx` labels the three views `Orphaned`, `Tally` and `Packages` in its view switch.

Orphaned hides the shared controls, because they apply to nothing there. It keeps Re-import, Backup and Reset reachable. The switch survives an empty ledger, so pending envelopes cannot be stranded. The switch carries a count badge while envelopes wait.

The old Hide received control is now Showing. See `ruled-head-showing-unreceived`.

## See also

- `recovery-control-not-state-gated` — why the switch must stay up on an empty ledger.
- `design-view-switch-equal-thirds` — the layout of the switch.
- `ruled-head-showing-unreceived` — the Showing control the switch shares.
- `orphaned-mail-never-decides` — the Orphaned view's limit on what it may decide.
