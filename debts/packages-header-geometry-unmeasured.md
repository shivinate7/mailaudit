# The Packages header geometry is unmeasured

**What.** The order id now has its own line in the package header. The Packages card height in `card-reserved-geometry` (335.67px at `1607933`) predates that line and is not re-measured. Claim 16 pins that Copied moves nothing. It does not pin whether the Copied stamp covers the end of the TCGplayer link at 320 and 375px. It does not pin whether a 21-character id shows whole at 320px: the id line also holds a 20px gap and the link. The 375px render is the builder's, and no probe re-ran it. The gap closes when each is measured in a real browser and the figures land in their records.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
