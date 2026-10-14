# Imports merge, never replace

TCGplayer only serves ~120 days of history. So this app is the system of record for older orders. A re-import must keep every existing item and all `received` state. It adds or refreshes entries by key. It must never drop an item.

**Pinned by:** 41.1 (a re-import onto three saved lines leaves five), 33.1 and 33.20 (`mergeItems`, the union the CSV import calls). Debt: `reimport-received-unpinned`.
