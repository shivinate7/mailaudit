# The Duo tab bar repeats the tab titles

**What.** RootView names each tab's title, symbol and badge twice: once for the system tab bar and once for the Duo's custom bar. A change to one list can miss the other. The Duo lane kept its RootView edit to one hook while the Restyle masthead step owned that file.

**Status:** open. Fold both into one list after the Restyle masthead step merges.

**Decision:** `duo-card-in-hand`.
