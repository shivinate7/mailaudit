# Imports merge, never replace

TCGplayer only serves about 120 days of order history, so this app is the only record of older orders. A re-import must keep every existing item and all received state. It may only add or refresh entries by key. It must never drop an item.
