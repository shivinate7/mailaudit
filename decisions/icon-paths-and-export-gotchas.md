# Icon paths stay relative, and iOS caches hard

Both icon link paths must stay relative, because Pages serves the site from a subpath. A root-absolute path resolves to the wrong place. Exporting the favicon PNG needs an absolute file path in the throwaway export page, or the render comes back blank while looking successful. Changing the icon PNG does nothing to an already-installed home-screen app, since iOS caches that icon hard. The fix is to delete and re-add it from Safari.

## The argument, as recorded

```
Two things that will bite:

- **Both `href`s must stay relative.** Pages serves this from the `/mailaudit/`
  subpath, so a root-absolute `/apple-touch-icon.png` resolves to
  `shivinate7.github.io/apple-touch-icon.png` and 404s.
- **Exporting the favicon PNG needs an ABSOLUTE `file://` src** in the throwaway
  HTML, and `--default-background-color=00000000` to keep the alpha. A relative
  src resolves against `/tmp`, renders nothing, and produces a blank PNG that
  looks like a successful export — it happened once.
- **iOS caches home-screen icons hard.** Changing the PNG does nothing to an
  already-installed home-screen app; it has to be deleted and re-added from
  Safari. That is safe for data — check-ins are keyed to the *origin*, not the
  icon — but take a Backup first out of habit.
```
