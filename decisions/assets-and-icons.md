# Icon files and how to export them

This file holds where the icon assets live, where the master and the generator sit, and the exact export commands. Read it before touching any icon file.

## Icon files and the two things that will bite

```
### Icons

`apple-touch-icon.png` (180×180), `favicon.svg` and `icon-32.png` are committed
assets at the repo root, referenced by `<link>` tags in the `build.mjs` head
template. The 1024 master and the generator live in `icon/` — `python3
icon/gen-icon.py` rewrites both the master SVG and `favicon.svg`, and that
file's docstring has the exact Chrome + `sips` commands to re-export the PNGs.
The generator is stdlib-only and never runs during build or test.

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

## See also

- `favicon-is-a-different-drawing`, the decision behind the second SVG.
- `icon-paths-and-export-gotchas`, the record for the relative-path and alpha traps.
