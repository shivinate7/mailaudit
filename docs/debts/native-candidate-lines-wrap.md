# Native candidate seller and meta lines wrap

**What.** On a candidate row in `native/Manifest/OrphanedView.swift`, the seller and the date, untracked tag and order id lines wrap at large Dynamic Type. The web row keeps each on one line and ends it with an ellipsis. The gap closes when the native lines truncate to one line, or the owner rules that wrapping is right on the phone.

**Status:** open. The deviation was kept on purpose, so the audit reads all the text.

**Decision:** `orphaned-colours-by-meaning`.
