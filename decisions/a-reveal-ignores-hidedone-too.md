# A reveal ignores hideDone too

A revealed package must ignore `hideDone` as well as the search `query`. Otherwise the jump lands on nothing when the tapped copy's package is already fully checked in. The `+N more` count in the footer promises lines. The `hideDone` filter would then hide those lines again.

Reveals clear when `query` or `dateFilter` changes. They do not clear when `view` changes. The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would clear the reveal on the very next commit.

Group 32 covers this behaviour.

## See also

- `a-search-filters-inside-a-package` — the search this reveal answers.
- `order-id-button-stops-propagation` — the other tap control in the same feature.
