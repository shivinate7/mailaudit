# The native Sync panel and Tally row copy six view rules in Swift

**What.** Six pieces of view logic live in Swift, and `rules-run-in-javascriptcore` says Swift holds no copy of a view rule. `SyncPanel.row` in `SyncPanel.swift` works out the Sync row's sub line, value and fix flag, and writes "Backed up <day>" itself. `SyncPanel.lastSyncText` writes the Last sync value, as the web's `lastSyncText` does. `SyncServerState.text` holds the Server line's wording. `SyncClient.serverState` runs the web's status ladder (no key, then the advisory). `TallyRow.barFraction` in `Tally.swift` works out the edge bar's fill. `TallyModel.step` clamps a count between 0 and the copy's qty, and so does `PackagesModel.step`. The web has the first four in `src/app.jsx` (`syncSays`, `lastSyncText`, `serverStatus`, the Sync `LedgerRow`) and no test compares the two. The web's `syncBroken` has two causes the native fix flag lacks, a stale clock and unreadable photos. Only a comment in `SyncPanel.swift` names them. Unit tests pin each Swift copy to its own expected text, so a change to the web wording leaves them green. The gap closes when each rule moves to `src/view-rules.mjs` and both clients call it, or the decision records the exception.

**Status:** open. No lane yet.

**Decision:** `rules-run-in-javascriptcore`.
