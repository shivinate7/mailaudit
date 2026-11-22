# On the 18 Pro at AX3, a Tally name breaks mid-word

**What.** On the iPhone 18 Pro at AX3, Tally, the name "Brainstorm" breaks mid-word as "Brainst". Shot: screen-check run 43796388049, head e1560957, light only, step 8 design review round 3. At that head the rest of the row sat under the Find pill. The last head did not cause it: only `FindPill.swift` changed there. Round 2 hid the row. The same class of break is in `native-axl-rows-break`, which covers the Tally long-set row at the largest size. This record covers AX3 on the Tally row. Step 8 matches lane N21 in `native-build-lanes`.

**Now.** Under owner ruling 95 b (page item 95, option b, 2026-11-21 19:54 CST), the Find pill floats over the list again, with no paper band: `findPill` in `FindPill.swift` is a `safeAreaInset` again, as it was before the band commit 070ad699. Ruled, not built at db9c4e8a. So row text can sit under the pill at rest, and its contrast goes unchecked (debt `find-pill-hides-row-contrast`). The cause of the break was never measured, and the band build was not shot for it. The cause stays unmeasured. The open Duo still has the overlay pill (`findPillOnDuo`), not changed.

**Status:** open at head e1560957. Filed at round 3 of review, under the global review cap (`roles-review-cap-three`; its held-change rule is `hold-unsafe-after-round-3`, in the owner's global decisions).

**Decision:** `ux-house-rules-govern`.

**Decision:** `card-tally-row-counts-first`.
