# A search result needs a way back

A search filters inside a package. So every result needs a way back to its whole order. One matching line draws a card that looks like a complete, one-line order. That is the wrong belief to hold with the envelope in hand. Clearing the search to find the seller costs enough on an iOS keyboard that nobody does it.

**Holds while:** `src/app.jsx` keeps `revealed` as a Set of package keys, and the Packages card shows a "show all" control.

The app keeps `revealed`, a set of package `gk` values. Packages in that set ignore the filters. They show their whole order. `revealed` is ephemeral UI state, and it is never persisted. So the five-site rule in `saved-state-shape` does not apply to it.

In Packages, a filtered card carries this footer: `+4 more lines in this order · show all`. It reveals that package only. The other results stay filtered. So near-duplicate candidates can be compared side by side.

In Tally, each source copy's order id is an underlined control with a `›`. It reveals that order, switches to Packages and scrolls to it. It leaves the search untouched, so one tap on the view switch comes straight back.

The Find search matches the card name, the set, the seller and the order. A stamp's label and note are part of the Packages search. A package-level hit keeps every line of its order. Filtering those lines would recreate the one-line lie. Group 32 covers the reveal.

**Pinned by:** group 32. Mutants confirmed red:
- `revealed` missing from `visible`'s dependency array, so the reveal renders one commit late or never;
- the reveal-clearing effect also keyed on `view`, which wipes the reveal that the Tally jump just set.

The other two group 32 mutants are recorded in `order-id-button-stops-propagate` and `a-reveal-ignores-hidedone-too`.

## See also

- `a-reveal-ignores-hidedone-too` — the rule that a reveal must also ignore `hideDone`.
- `order-id-button-stops-propagate` — the tap control that starts a Tally reveal.
- `saved-state-shape` — the five-site rule that does not apply to `revealed`.
- `tally-counts-ignore-the-filters` — the counts that filters never change.
