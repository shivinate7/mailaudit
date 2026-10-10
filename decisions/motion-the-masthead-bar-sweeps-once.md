# The masthead bar turns green a beat late

The masthead progress bar takes its green a beat after its width lands. The two read as cause and effect, not as one event. The bar sweeps once.

**Holds while:** `ProgressBar` in `src/app.jsx` delays its background change for at least as long as its width change runs.

The bar is reachable but rare. 100% there means that every card in the ledger has arrived. That is the largest thing this app has to say.

## See also

- `motion-timings` — the exact beat delay between width and green.
- `motion-a-completed-package-is-gilded` — the same cause-then-effect beat, on a single card.
