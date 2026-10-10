# The favicon is redrawn, not the master shrunk

A browser tab renders the favicon at 16 pixels, but the master icon is a full scene meant to be seen large. At tab size the background ate the frame, and the mark read small and washed out. The favicon drops the background entirely, since favicons allow transparency and the touch icon does not, and scales the mark until it fills the edge. Everything that only reads at a large size gets cut.

## See also

- `icon-paths-and-export-gotchas` — the export step that can produce a blank favicon
- `testing-jsdom-has-no-layout` — why a rendering claim like this needs a real browser
