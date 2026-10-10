# The upload zone opens only on an empty ledger

The upload zone opens when the user asks for it. It also opens when the ledger has no items and no envelopes.

**Holds while:** `src/app.jsx` shows the upload zone when `showUpload` is set, or when `items.length === 0 && envelopes.length === 0`.

The zone used to open on an empty item list alone. That made the Re-import cell a disclosure. Its `aria-expanded` flipped over a panel that was open regardless.

Re-import stays reachable when envelopes exist. Test 23.2 covers that. Tests 23.2b–23.2d pin the zone's open state.

## See also

- `action-row-is-ruled-cells` — the Re-import cell that opens the zone.
- `recovery-control-not-state-gated` — the rule that recovery controls stay visible.
