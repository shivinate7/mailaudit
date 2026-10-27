# The chip-gap tolerance needs a 12px re-measure

**What.** The 12px chip gap is not re-measured. Claim 12 of `check:screens` allows a reach of 0.25px past each chip's gap midpoint. The constant is `STAMP_TOL_PX` in `test/screens.mjs`. The owner allowed that reach on 2026-10-13, so a tap within 0.25px of a chip gap midpoint can go to either chip. At the 10px gap, claim 12 passed a 43.75px hit area with a 0.25px centring offset. Three chips (Claim filed, Refunded, Seller contacted) measured that on the lane build. The other three measured 44px. The gap closes when claim 12 is re-measured at the 12px chip gap, and the tolerance is then kept or dropped on that result.

**Status:** open. Measured at the 10px gap only.

**Decision:** `ux-house-rules-govern`.
