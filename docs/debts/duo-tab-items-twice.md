# The Duo tab bar repeats the tab titles

**What.** RootView names each tab's title, symbol and badge twice: once for the system tab bar and once for the Duo's custom bar. A change to one list can miss the other.

**Status:** open. Fold both into one list once the Restyle masthead lane (branch step5-masthead) has merged, since that lane also edits RootView.

**Decision:** `duo-card-in-hand`.
