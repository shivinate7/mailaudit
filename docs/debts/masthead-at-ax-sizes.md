# At accessibility sizes the stacked masthead hides figures

**What.** At accessibility sizes the stacked masthead grows taller than the window, and figures run off it at rest. Shots: screen-check run 43796388049, head e1560957, light only, step 8 design review round 3.
- iPhone 18 Pro, AX5: the outstanding value "$67.50" is cut on Packages and on Tally.
- iPhone Duo folded, AX3: "14 still missing · $67.50" is hidden.
- iPhone Duo folded, AX5: "$0/$68" is cut.
- iPhone Duo open, AX5: "$68" is cut on Packages. The Tally left page has no pill there, and "14 still missing" runs off the window edge.

The Find pill is not the cause. It has held one line since dcdccd71 (51 pt at AX3, 55 to 59 pt at AX5). Fix ideas: set the masthead in columns at AX sizes, or give the bottom a content inset that keeps the summary line clear. This is the same masthead as `native-masthead-axl-clips`, which covers the foot row and the running head. This record covers figures cut off at rest. Step 8 matches lane N21 in `native-build-lanes`. The fix lane is `masthead-at-ax-sizes`, not yet started.

**Status:** open at head e1560957. Filed at round 3 of review, under the global review cap (`roles-review-cap-three`; its held-change rule is `hold-unsafe-after-round-3`, in the owner's global decisions).

**Decision:** `masthead-running-head-sticky`.

**Decision:** `masthead-is-one-letterhead`.
