# The native card copies the line and package done rules in Swift

**What.** `LineState` in `PackageCard.swift` and `packageState` in `PackagesView.swift` work out whether a line, and a whole package, is done, partial or open in Swift. `rules-run-in-javascriptcore` says Swift holds no copy of a view rule. A parity test covers `isDone`, but not the package rule or the partial state. The model also fills a `done` map in `Packages.swift`, one `isDone` call per line, and the view never reads it. The gap closes when the view reads its state from the bundle and the unread map goes, or the decision records the exception.

**Status:** open. No lane yet.

**Decision:** `rules-run-in-javascriptcore`.
