# The native Sync panel and Tally row copy five view rules in Swift

**What.** Five pieces of view logic live in Swift, and `rules-run-in-javascriptcore` says Swift holds no copy of a view rule. `SyncPanel.row` in `SyncPanel.swift` works out the Sync row's sub line, value and fix flag. `SyncServerState.text` holds the Server line's wording. `SyncClient.serverState` runs the web's status ladder (no key, then the advisory). `TallyRow.barFraction` in `Tally.swift` works out the edge bar's fill. `TallyModel.step` clamps a count between 0 and the copy's qty, and so does `PackagesModel.step`. The web has the first three in `src/app.jsx` (`syncSays`, `serverStatus`, the Sync `LedgerRow`) and no test compares the two. Unit tests pin each Swift copy to its own expected text, so a change to the web wording leaves them green. The gap closes when each rule moves to `src/view-rules.mjs` and both clients call it, or the decision records the exception.

**Status:** open. No lane yet.

**Decision:** `rules-run-in-javascriptcore`.
