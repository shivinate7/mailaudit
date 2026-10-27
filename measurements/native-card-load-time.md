# Native Packages load time

**Status:** measured 2026-10-26 on an Apple M5 Pro, macOS 27.0, Swift 6.4, a debug build under `swift test`. Before: the head `c40f925` (the card branch with the review fixes half done). After: the same code with the one-hop `load()` below. Six loads each, in a scratch package that is not committed.

This record holds the time `PackagesModel.load()` takes on a large ledger: 600 packages, 1500 lines. The Packages screen cannot show rows until `load()` ends, so this is the wait after a launch, a pull or a restore. Re-measure after a change to `PackagesModel.load()`, to `refresh`, or to any rule the card calls.

| Head | Hops into JavaScriptCore | `load()` over six runs, ms | Median |
| --- | --- | --- | --- |
| before, one hop per package | 600 | 838, 991, 1237, 1004, 896, 814 | about 950 |
| after, one hop for all packages | 1 | 132, 132, 124, 105, 126, 123 | about 125 |

The calls inside the hop are the same, plus the `gotQty` call per line in the after row. The gain is the 600 hops of the actor (`RulesEngine`), not the rules. The list view is a `LazyVStack`, so the screen builds only the rows in view. It reads dictionaries the model filled and calls no rule.

## How to re-measure

1. Make the ledger: a script that writes 600 orders. The first 300 hold 3 lines and the last 300 hold 2, so 1500 lines. Line `n` has qty `1 + n % 3`, price `1 + (n % 50) / 10`, seller `Seller (order % 97)`, tracking `without tracking`, and every fourth line is in `received` with count 1. The file is `{"mailday":1,"items":[...],"received":{...}}`.
2. In a scratch copy of `native/ManifestKit` (the same `Package.swift`, with a test target in a folder of your own), add one `@MainActor` XCTest. It copies the ledger to a temp folder, makes a `LedgerStore` and calls `store.load()`. It makes a `RulesEngine` over `rules.js` and a `PackagesModel`. It then times `try await model.load()` six times with the monotonic clock and prints the milliseconds.
3. Run `swift test --filter <the test>` through `verdict` with a kept log path, and read the printed line from the log.

The first load is not slower than the rest, so the six are one sample. Debug builds are slower than the Release archive that ships. Compare the two rows, not the figures with a phone.

**Holds while:** `load()` makes one `RulesEngine.calls` for all packages, and the list view calls no rule.
