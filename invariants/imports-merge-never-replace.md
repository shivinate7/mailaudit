# Imports merge, never replace

TCGplayer only serves ~120 days of history. So this app is the system of record for older orders. A re-import must keep every existing item and all `received` state. It adds or refreshes entries by key. It must never drop an item.
