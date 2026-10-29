# The native Packages load with stamps is unmeasured

**What.** Step 6 adds stamp work to `PackagesModel.load()` (`native/ManifestKit/Sources/ManifestKit/Packages.swift`): eight or more hops into JavaScriptCore, three of them one call per stored stamp. Measurement `native-card-load-time` asks for a re-measure after any change to `load()`, and its figures predate this. The card also grew 48pt at rest, so measurement `card-reserved-geometry` is stale too. Step 6 review round 1 found it. The gap closes when both measurements are taken again on the step 6 code, and the per-stamp calls are folded into one hop if the load grows past the old figure.

**Status:** open. Step 6 lands with it open.

**Decision:** `rules-run-in-javascriptcore`.
