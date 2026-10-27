# No unit test pins the native card stepper clamp or its readouts

**What.** `PackagesModel.step` in `Packages.swift` clamps the count with `min(max(...))`. Removing the clamp leaves every test green. The UI test presses `+` then `−` only, never `−` at 0 or `+` at the quantity. No test proves that `readouts` comes from the rules bundle (`gotQty`) and not from a Swift copy. The gap closes when `PackageCardModelTests` pins both clamp edges and a bundle shim proves the readout's source.

**Status:** open. No lane yet.

**Decision:** `rules-run-in-javascriptcore`.
