# A reveal ignores hideDone too

A revealed package must ignore `hideDone` as well as the search `query`. Otherwise the jump lands on nothing when the tapped copy's package is already fully checked in. The `+N more` count in the footer promises lines. The `hideDone` filter would then hide those lines again.

**Holds while:** `visible` in `src/app.jsx` returns a revealed package before it applies `hideDone`. The reveal effect keys on `query` and `dateFilter` only.

Reveals clear when `query` or `dateFilter` changes. They do not clear when `view` changes. The Tally jump sets `revealed` and `view` in one handler. A `view` dependency would clear the reveal on the very next commit.

Group 32 covers this behaviour.

**Pinned by:** group 32. Mutant confirmed red: a reveal that bypasses the query but not `hideDone`. That shows less than the whole order. It also strands the Tally jump on a fully received package.

## See also

- `search-filters-inside-package` — the search this reveal answers.
- `order-id-button-stops-propagate` — the other tap control in the same feature.
