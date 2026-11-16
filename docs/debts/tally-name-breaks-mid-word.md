# On the 18 Pro at AX3, a Tally name breaks mid-word under the pill

**What.** On the iPhone 18 Pro at AX3, Tally, the name "Brainstorm" breaks mid-word as "Brainst". The rest of the row sits under the Find pill. Shot: screen-check run 43796388049, head e1560957, light only, step 8 design review round 3. The last head did not cause it: only `FindPill.swift` changed there. Round 2 hid the row. The same class of break is in `native-axl-rows-break`, which covers the Tally long-set row at the largest size. This record covers AX3 under the pill. Step 8 matches lane N21 in `native-build-lanes`.

**Status:** open at head e1560957. Filed at round 3 of review, under the global review cap (`roles-review-cap-three`; its held-change rule is `hold-unsafe-after-round-3`, in the owner's global decisions).

**Decision:** `ux-house-rules-govern`.

**Decision:** `card-tally-row-counts-first`.
