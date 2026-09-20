# The favicon is redrawn, not the master shrunk

A browser tab renders the favicon at 16 pixels, but the master icon is a full scene meant to be seen large. At tab size the background ate the frame, and the mark read small and washed out. The favicon drops the background entirely, since favicons allow transparency and the touch icon does not, and scales the mark until it fills the edge. Everything that only reads at a large size gets cut.

## The argument, as recorded

```
**The favicon is a different drawing, not the master shrunk.** A tab renders it
at 16 CSS px; the master is a *scene* — a brooch on a violet ground — so at that
size the ground ate the frame and the mark landed around 10px, reading small and
washed out beside other tabs' icons. `favicon_svg()` drops the ground entirely
(transparent, which favicons allow and `apple-touch-icon` does not), scales the
mark until the lobes touch the edge, and cuts everything that only exists to be
seen large: the guilloche, the 32 scroll marks, the engine-turned field. What is
left is what still reads at 16px — gold ring, eight lobes, emerald centre.
The SVG is served first with the PNG as a fallback for browsers that don't take
`type="image/svg+xml"`.
```

## See also

- `icon-paths-and-export-gotchas` — the export step that can produce a blank favicon
- `testing-jsdom-has-no-layout` — why a rendering claim like this needs a real browser
