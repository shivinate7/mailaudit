# The native Tally re-sorts on every reload

**What.** `TallyModel.load()` places the order again on each reload (`Tally.swift`, `load()`). Under a value sort, a Worker apply that lands while the owner reads Tally moves rows under the finger. The web keeps the order while its source and sort are unchanged (`src/app.jsx` `packageOrder`, deps `[orderSource, sortBy]`). Restyle step 8 fixed this for Packages only: `Packages.swift` keeps `order`. Step 8 review round 2 found it on 2026-11-08. The gap closes when Tally keeps its order across a reload with the same source and sort, and a test pins a reload under a value sort.

**Status:** open. Restyle lane, after step 8.

**Decision:** `no-layout-shift-under-pointer`.
