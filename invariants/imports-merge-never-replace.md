# Imports merge, never replace

TCGplayer only serves ~120 days of history. So this app is the system of record for older orders. A re-import must keep every existing item and all `received` state. It adds new lines and refreshes `tracking` on a line whose key is already stored. Received marks and every other field of that line are kept. It must never drop an item. The Worker's `POST /ledger` never drops an item either, so a device's write never drops one.

Owner ruling (page item 89 b) sets the `tracking` refresh. It is not built yet. Tests 57.14 and 57.15 pin today's behaviour: a canceled re-import leaves the stored line unchanged. A fix turns 57.14 red, and the later `mergeItems` lane re-points both tests.

**Pinned by:** 57.1 to 57.13 and 57.16 (a CSV re-import keeps every line and received mark), 33.1 and 33.20 (`mergeItems`, the union the CSV import calls), and worker test 4.3 (the Worker merge keeps items from both sides).
