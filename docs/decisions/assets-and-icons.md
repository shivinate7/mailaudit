# Icon files and how to export them

This file holds where the icon assets live, where the master and the generator sit, and the exact export commands. Read it before touching any icon file.

**Holds while:** `build.mjs` links the three icon files with relative `href` values. `icon/gen-icon.py` defines `favicon_svg()`. `native/project.yml` names the `AppIcon` set.

## Where the icon files live

`apple-touch-icon.png` (180×180), `favicon.svg` and `icon-32.png` are committed at the repo root. The `<link>` tags in the `build.mjs` head template reference them. The 1024 master and the generator live in `icon/`. Running `python3 icon/gen-icon.py` rewrites both the master SVG and `favicon.svg`. That file's docstring has the exact Chrome and `sips` commands to re-export the PNGs. The generator uses only the standard library. It never runs during build or test.

## The native app icon

The iOS app holds one icon: `native/Manifest/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`. It is a single 1024×1024 universal iOS icon, opaque, with no alpha. It is the master `icon/apple-touch-icon.svg` exported at full size with the Chrome command in `gen-icon.py`. It is not the favicon drawing. `native/project.yml` sets `ASSETCATALOG_COMPILER_APPICON_NAME` to `AppIcon`. Xcode derives every smaller size at build time. Without the catalog the archive has no `Assets.car` and no `CFBundleIconName`, and App Store Connect rejects the upload. After an `ios-ship testflight --export-only`, check that the app in the archive holds `Assets.car` and that `plutil -p Info.plist` shows `CFBundleIconName` as `AppIcon`. Re-export the PNG when the master changes. The `sips` step does not apply.

## The favicon is a different drawing

The favicon is not the master, shrunk. A tab renders it at 16 CSS px. The master is a scene: a brooch on a violet ground. At that size the ground ate the frame, and the mark landed around 10px. It read small and washed out beside other tabs' icons.

`favicon_svg()` drops the ground entirely. The result is transparent, which favicons allow and `apple-touch-icon` does not. It scales the mark until the lobes touch the edge. It cuts everything that exists only to be seen large: the guilloche, the 32 scroll marks, and the engine-turned field. What remains is what still reads at 16px: gold ring, eight lobes and emerald centre.

The SVG is served first. The PNG is the fallback for browsers that do not accept `type="image/svg+xml"`.

## Traps when you change icons

- Both `href`s must stay relative. Pages serves this site from the `/mailaudit/` subpath. A root-absolute `/apple-touch-icon.png` resolves to `shivinate7.github.io/apple-touch-icon.png` and 404s.
- Exporting the favicon PNG needs an ABSOLUTE `file://` src in the throwaway HTML. Also pass `--default-background-color=00000000` to keep the alpha. A relative src resolves against `/tmp`. It renders nothing, and it produces a blank PNG that looks like a successful export. That happened once.
- iOS caches home-screen icons hard. Changing the PNG does nothing to an app that is already installed on the home screen. Delete the app and add it again from Safari. That is safe for data, because check-ins are keyed to the origin, not the icon. Take a Backup first anyway.

## See also

- `favicon-is-a-different-drawing`, the decision behind the second SVG.
- `icon-paths-and-export-gotchas`, the record for the relative-path and alpha traps.
