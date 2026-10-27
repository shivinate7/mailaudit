# Each level states what is still outstanding

The app states what is still outstanding at three levels: the whole ledger, each package and each Tally item.

**Holds while:** `src/app.jsx` renders the whole-ledger figure in the words "still missing".

The masthead says "$X still missing" for the whole ledger. Each package says "N left · $Y". Each Tally item says the same. The red figure is what is still outstanding. Basis is what was paid.

## See also

- `masthead-foot-slot` — the masthead line that shows the whole-ledger figure.
- `masthead-tallies-unequal-thirds` — the tally cells the figure sits in.
- `cost-basis-excludes-ship-and-tax` — the basis that the red figure is set against.
