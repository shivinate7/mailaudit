# Icon paths stay relative, and iOS caches hard

Both icon link paths must stay relative, because Pages serves the site from a subpath. A root-absolute path resolves to the wrong place. Exporting the favicon PNG needs an absolute file path in the throwaway export page, or the render comes back blank while looking successful. Changing the icon PNG does nothing to an already-installed home-screen app, since iOS caches that icon hard. The fix is to delete and re-add it from Safari.

## See also

- `favicon-is-a-different-drawing` — the drawing these export steps produce
- `testing-jsdom-has-no-layout` — why an export defect like a blank PNG needs a real render to catch
