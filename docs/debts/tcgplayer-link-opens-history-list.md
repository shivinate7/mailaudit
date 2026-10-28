# The TCGplayer link may not search by order id

**What.** The order id link opens `orderhistory?SearchString=<id>`, the URL the owner gave on 2026-10-21 (`tcgplayerOrderUrl` encodes the id). The build matches the ruling whatever the page does. The orders spike of 2026-10-27 fetched the page signed in by page number, and its filter form has a SearchString field. A GET with SearchString in the URL was not tried, so whether the page applies it and lands on the order is unmeasured. If it does not, the link opens the plain order list. The gap closes when the owner follows the link signed in and says what opens.

**Status:** open. Needs the owner's check while signed in.

**Decision:** `order-id-button-stops-propagate`.
