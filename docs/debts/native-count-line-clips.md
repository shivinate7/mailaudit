# The native count line clips with no ellipsis at 4-digit counts

**What.** The native count line is one line with no `minimumScaleFactor`, so at 4-digit counts, or at xxxLarge text at 320pt, it clips with no ellipsis. The spec asked for `minimumScaleFactor(0.75)`. The gap closes when the count line scales or truncates visibly, and a check at 320pt with xxxLarge and a 4-digit count reads it whole or marked cut.

**Status:** open.

**Decision:** `masthead-save-slot-reserved`.
