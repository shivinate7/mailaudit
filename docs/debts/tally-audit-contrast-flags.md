# The Tally audit flags contrast and inaccessible text that the token pairs clear

**What.** On the Tally screen the accessibility audit reports "Contrast failed" on the red "N left" line, the "$ / copy" rate, the meta line and the disclosure triangle of some rows, and "Potentially inaccessible text" on an open row. Every pair is in `TallyRowPaint` and clears 4.5:1 on the card in `TallyRowPaintTests` (red on card is 5.48). Orphaned shows the same class of flag on its small text. The audit samples rendered pixels, so a glass tab bar over the last rows or small antialiased text may cause it; the cause is unmeasured. The audit tests `testAccessibilityAuditTallyScreenWithRows`, `testAccessibilityAuditTallyScreenWithARowOpen` are red on this account. The gap closes when the cause is found and both tests pass with no trait dropped, fixed-size font or hidden element.

**Status:** open. The lane that restyles Orphaned is diagnosing the same flags.

**Decision:** `palette-tokens-contrast-floor`.
