# The native package card has no lost-mail flag and no tracked glyph

**What.** The web card's date line carries a lost-mail warning (`lostMail`: "may be lost" from 14 days, "refund window closing" from 30) and a tracked or untracked glyph after the date (`lost-mail-flags-use-order-date`, `stamped-package-hides-lost-flag`). The native card paints the date alone. The bundle already holds `lostMail`, so the gap is the view and a model entry per package, plus a test of each. The gap closes when a lane builds them.

**Status:** open. No lane is briefed.

**Decision:** `native-parity-table`.
