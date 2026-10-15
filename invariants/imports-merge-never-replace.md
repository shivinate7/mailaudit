# Imports merge, never replace

TCGplayer only serves ~120 days of history. So this app is the system of record for older orders. A re-import must keep every existing item and all `received` state. It adds or refreshes entries by key. It must never drop an item. The Worker's `POST /ledger` merges the same way, so a device's write never drops one either.

**Pinned by:** 41.1 (a re-import onto three saved lines leaves five), 33.1 and 33.20 (`mergeItems`, the union the CSV import calls), and 4.3 (the Worker merge keeps items from both sides). Debt: `reimport-received-unpinned`.
