# The Tally order id has no narrow-width rule

**What.** The package header gives the order id its own line (built 2026-10-20). The Tally source row still ends a long id in an ellipsis at narrow widths. The gap closes when the Tally row gets the same rule.

**Status:** open. Ruled 2026-10-11, built for the package header only. No lane yet.

**Decision:** `order-id-button-stops-propagate`.
