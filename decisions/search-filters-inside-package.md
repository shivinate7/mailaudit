# A search result needs a way back

A search filters *inside* a package. So every result needs a way back to its whole order. One matching line draws a card that looks like a complete, one-line order. That is the wrong thing to believe with the envelope in your hand. Clearing the search to find the seller costs enough on an iOS keyboard that nobody does it.

**Holds while:** `src/app.jsx` still keeps `revealed` as a Set of package keys, and the Packages card still shows a "show all" control.

So the app has `revealed`, a set of package `gk` values. The packages in that set ignore the filters and show their whole order.

**Pinned by:** group 32. Mutants confirmed red:
- `revealed` missing from `visible`'s dependency array, so the reveal renders one commit late or never;
- the reveal-clearing effect also keyed on `view`, which wipes the reveal that the Tally jump just set.

The other two group 32 mutants are recorded in `order-id-button-stops-propagate` and `a-reveal-ignores-hidedone-too`.

## See also

- `a-reveal-ignores-hidedone-too` — the rule a reveal must also honor.
- `order-id-button-stops-propagate` — the tap control this feature adds.
