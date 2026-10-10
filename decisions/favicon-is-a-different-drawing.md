# The favicon is redrawn, not the master shrunk

A browser tab renders the favicon at 16 CSS px. The master icon is a scene: a brooch on a violet ground. At that size the ground takes over the frame, and the mark is around 10px. It reads small and washed out beside other tabs' icons.

**Holds while:** `favicon_svg()` in `icon/gen-icon.py` draws no background. `build.mjs` lists `favicon.svg` before `icon-32.png`.

So the favicon is a different drawing. `favicon_svg()` drops the ground entirely. The ground is transparent, which favicons allow and `apple-touch-icon` does not. It scales the mark until the lobes touch the edge. It cuts everything that exists only to be seen large: the guilloche, the 32 scroll marks, and the engine-turned field. What remains is what still reads at 16px: a gold ring, eight lobes, and an emerald centre.

The SVG is served first. The PNG is the fallback for browsers that do not accept `type="image/svg+xml"`.

## See also

- `icon-paths-and-export-gotchas` — the export step that can produce a blank favicon
- `testing-jsdom-has-no-layout` — why a rendering claim like this needs a real browser
