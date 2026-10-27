# Claim 17a sometimes finds the chevron within reach of the order id link

**What.** On CI, `check:screens` claim 17a failed twice and passed on re-run both times. Run 39892195068, at 375px stamped, and run 39900120189, at 320px unstamped, each logged the same failure. Twelve taps aimed at the chevron, at x 60.5 and y 400.5 to 411.5, opened TCGplayer at a 12px contact radius. The link's area began at x 65.0, so the chevron sat 4.5px from it. `order-id-button-stops-propagate` claims 13.5px of clear header on each side of the link. Neither run changed web code, so the layout varies from run to run, most likely by load timing. The gap closes when the cause is found and the check passes on every run, or when the chevron sits clear of the link's reach in every layout.

**Status:** open. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
