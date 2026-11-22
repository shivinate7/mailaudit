# The Find pill's skip never checks row contrast under the pill

**What.** Under owner ruling 95 b (page item 95, option b, 2026-11-21 19:54 CST), the native accessibility audit skips the contrast type on every element whose frame shares area with the Find pill's frame (`audit-skips-measured-flags`). The pill floats over the list at rest, so row text under it goes unchecked for contrast in the pro-ui audits. A real contrast defect on that row text passes while the pill covers it. The other audit types still run on those rows. The pill's own prompt and clear button (`find-field`, `find-clear`) stay audited. Ruled, not built at db9c4e8a.

**Status:** named limit. The owner chose option b on 2026-11-21 19:54 CST (skip the contrast audit on the Find pill's frame, with no paper band). It reopens only on a new owner ruling.

**Decision:** `audit-skips-measured-flags`.
