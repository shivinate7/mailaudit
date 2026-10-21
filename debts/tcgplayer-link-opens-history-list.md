# The TCGplayer link opens the order list, not the order

**What.** The link in the package header opens the buyer order-history page. No per-order buyer URL is confirmed (searched 2026-10-20), so the owner finds the order in the list. Whether that page searches by order number is unconfirmed. The gap closes when a per-order URL is confirmed, `TCGPLAYER_ORDERS` in `src/app.jsx` builds it from the order id, and a test pins it.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
