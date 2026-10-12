# The bar's working views share one check-in state

The bottom bar replaces the top view switch at every width (`phone-nav-is-bottom-bar`). It switches between three working views: Orphaned, Tally and Packages. Tally and Packages share one `received` map, the date filter, search and Showing.

**Holds while:** `src/app.jsx` renders the bar with its three working tabs, Orphaned, Tally and Packages, after the Ledger tab. Test 62.8 pins that no in-page switch remains.

Orphaned hides the shared controls, because they apply to nothing there. That covers the date filter, the list, the canceled reference and the search pill. The bar survives an empty ledger, so pending envelopes cannot be stranded. The Orphaned tab carries a count badge while envelopes wait.

Re-import, Backup and Reset must stay reachable from Orphaned. No test pins that. It is unverified.

The old Hide received control is now Showing. See `ruled-head-showing-unreceived`.

**Pinned by:** 21.4 (tab order), 62.8 to 62.10 (no in-page switch; four tabs on an empty ledger; the Orphaned count).

## See also

- `recovery-control-not-state-gated` — why the bar must stay up on an empty ledger.
- `phone-nav-is-bottom-bar` — the bar that now holds these tabs.
- `ruled-head-showing-unreceived` — the Showing control the working views share.
- `orphaned-mail-never-decides` — the Orphaned view's limit on what it may decide.
