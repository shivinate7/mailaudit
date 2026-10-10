# The progress bar is accent, then green at 100%

The progress bar fills with accent violet while it is in progress. It turns green at 100%. It never uses `ink`.

**Holds while:** `ProgressBar` in `src/app.jsx` fills with `C.green` at 100% and `C.accent` below it, and the two card bars pass `radius={0}`.

`ink` is a near-black violet. On parchment, an `ink` bar would read as flat black. The old theme used `ink` for this bar, when `ink` was a near-black green. That worked. The new `ink` does not, so the fill is `accent`.

The track behind the fill is `silver`. The two card bars and the masthead bar use the same component. The two card bars sit on their card's top edge, and they have no radius of their own. The card's 10px corner rounds them. A pill there would read as a second, smaller shape inside the first. The masthead bar keeps its full pill.

## See also

- `card-the-bar-is-out-of-flow` — why the card bar sits on the card's top edge.
- `palette-tokens-contrast-floor` — the `accent`, `green`, `ink` and `silver` tokens.
- `motion-masthead-bar-sweeps-once` — the masthead bar takes its green a beat after it fills.
