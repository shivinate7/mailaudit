# Icon paths stay relative, and iOS caches hard

Both icon `href`s must stay relative. Pages serves this site from the `/mailaudit/` subpath. A root-absolute `/apple-touch-icon.png` resolves to `shivinate7.github.io/apple-touch-icon.png` and 404s.

Exporting the favicon PNG needs an ABSOLUTE `file://` src in the throwaway HTML. Also pass `--default-background-color=00000000` to keep the alpha. A relative src resolves against `/tmp`. It renders nothing, and it produces a blank PNG that looks like a successful export. That happened once.

iOS caches home-screen icons hard. Changing the PNG does nothing to an app that is already installed on the home screen. Delete the app and add it again from Safari. That is safe for data, because check-ins are keyed to the origin, not the icon. Take a Backup first anyway.

## See also

- `favicon-is-a-different-drawing` — the drawing these export steps produce
- `testing-jsdom-has-no-layout` — why an export defect like a blank PNG needs a real render to catch
