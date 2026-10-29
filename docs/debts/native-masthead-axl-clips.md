# The native masthead wraps and clips at accessibility text sizes

**What.** At accessibility text sizes two masthead lines break. The empty save-slot reserve (`SaveSlot`, 13 characters wide, in `native/Manifest/MastheadView.swift`) takes about half the foot row, so "14 still missing · $67.50" wraps over 3 lines where the web keeps one. The pinned running head (`native/Manifest/MastheadScreen.swift`, `RunningHead`) reads "MANIF… 0/14 · $…", because the title neither shrinks nor yields and the figure has a one-line limit, so the missing amount is lost; the web always shows the whole figure. Default sizes are fine. The step 5 design review of 2026-10-28 found them. The gap closes when both lines keep their full text at accessibility sizes with the slot still reserved (`masthead-save-slot-reserved`), and an audit at that size passes.

**Status:** open. Step 5 merges with it open.

**Decision:** `masthead-running-head-sticky`.
