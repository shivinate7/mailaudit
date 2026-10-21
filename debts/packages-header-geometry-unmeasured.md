# The Packages header geometry is unmeasured

**What.** The order id link has its own line in the package header, 16px under the date line. The Packages card height in `card-reserved-geometry` (335.67px at `1607933`) predates that line and is not re-measured. Whether the id line shows a 21-character id whole at 320px is unmeasured. The 375px render is the builder's, and no probe re-ran it. The gap closes when each is measured in a real browser and the figures land in their records.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
