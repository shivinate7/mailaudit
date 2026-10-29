# The native masthead foot's second row sits 4.6pt low

**What.** On every tab, the masthead foot's second row sits about 4.6pt lower than the web's. The web draws the foot as two touching 12px lines, 24 in all. The native foot puts `.padding(.top, 4)` above row 2 (`native/Manifest/MastheadView.swift`, the foot). The same file spaces other masthead siblings with top padding inside a `VStack(spacing: 0)`, where the house rule wants the stack's spacing. The step 5 design review of 2026-10-28 found both. The gap closes when the foot's rows touch as on the web and the masthead's siblings take their spacing from the stack.

**Status:** open. Step 5 merges with it open.

**Decision:** `masthead-is-one-letterhead`.
