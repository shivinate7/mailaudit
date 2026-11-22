# The TCGplayer link opens that exact order

**What.** The order id link opens `orderhistory?SearchString=<id>`, the URL the owner gave on 2026-10-21 (`tcgplayerOrderUrl` encodes the id). The build matches the ruling whatever the page does. The orders spike of 2026-10-27 fetched the page signed in by page number, and its filter form has a SearchString field. A GET with SearchString in the URL was not tried. The owner reports the link "takes me to that exact order" (item 61, 2026-11-21 19:56 CST).

**Status:** closed by the owner's answer, item 61. Kept until a pull request that deletes this file cites a passing run as `Retire-run:`.

**Decision:** `order-id-button-stops-propagate`.
