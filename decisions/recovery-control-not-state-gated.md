# A recovery control cannot need the state it recovers

If the data an action works on is absent, its recovery control must not hide. Otherwise the control is unreachable in the one case it exists for. Backup must still show for envelopes without items. The Ledger tab must still show for an empty ledger, with Re-import CSV and Reset on it.

**Holds while:** `src/app.jsx` renders the Ledger tab on every ledger. Backup, Re-import CSV and Reset have no data gate. The Sync row gate is `window.remote || window.sync`. The History row gate is `window.versions || window.remote`.

## Gates in the current build

- Backup shows on every ledger. A user with hand-typed orphaned envelopes and an empty item list keeps a Backup button. That data exists nowhere else. Test 23.1.
- Re-import CSV and Reset show on every ledger. On an empty ledger, Re-import opens the upload zone. Reset sits in its own box, last.
- The View group (Showing, Sorted by, Orders from) shows only for a ledger with items. The filters describe a list that is not there, so they keep the narrower gate.
- The Sync row shows for a device with a remote or a Worker. On an empty ledger it shows alone, with the device key box inside it.
- The History row shows for a device with the versions adapter or the remote. It holds the control that undoes a Reset. Gating it on `items.length` would hide it just after a Reset.

## The rule

Any control that recovers state must not be gated on that state existing. Backup was widened once for this reason. The Sync row was widened twice.

The Pull that recovers an empty device is gone (owner ruling 2026-10-12). The Sync row still gives such a device its key box. The rule still holds for the controls that remain.

## See also

- `ruled-head-one-advisory-entrance` — the same rule applied to the sync entrance.
- `ledger-tab-holds-options` — the Ledger tab that holds these controls.
- `unwritable-store-says-so` — another control that must stay visible on failure.
- `pull-needs-a-key-too` — the recovery that the Sync group no longer offers.

**Pinned by:** 63.16 to 63.20 (an empty ledger still reaches Sync, History, Re-import CSV, Backup and Reset), 64.7 (an empty ledger still reaches the device key box), and 23.1 (Backup survives an empty item list).
