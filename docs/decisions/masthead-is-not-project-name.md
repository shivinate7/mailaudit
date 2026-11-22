# The masthead is not the project name

The app presents itself as **MANIFEST**, under a C.H Postal Company letterhead. The project name stays Mail Day Ledger. The repo keeps `mailaudit`, and the storage namespace keeps `mailday:`. None of those may follow the masthead. See `storage-keys-are-frozen`. Real check-in data sits under those keys.

**Holds while:** `build.mjs` sets the page title to `Manifest` and the iOS title to `CH Post`, `STORAGE_KEY` in `src/app.jsx` is `mailday:v1`, `CFBundleDisplayName` in `native/project.yml` is `CH Post`, and line 21 of `extension/options.html` is the letterhead `MANIFEST`.

The browser `<title>` in `build.mjs` is "Manifest". The `apple-mobile-web-app-title` is "CH Post" (owner, 2026-11-21 17:05 CST, "change that too"). iOS bakes that label in at install time, so a web app already on the home screen keeps its old label until the owner deletes it and adds it again from Safari. The label differs from the browser title on purpose. Do not fix it without asking.

The native app's home-screen label is also **CH Post** (owner, 2026-11-21 17:02 CST): `CFBundleDisplayName` in `native/project.yml`. The bundle id, product name, scheme and the in-app masthead stay as they were.

## The extension

The extension options page letterhead (`extension/options.html` line 21) is the masthead, so it stays **MANIFEST**. The extension's own name elsewhere (page title, manifest name, docs and store text) is **CH Post** (owner ruling 114 b, 2026-11-21 19:54 CST).

This keeps the options letterhead as MANIFEST by the coordinator's own pick on waiting item 118. The pick runs under the standing ruling `own-goal-dont-wait-on-me` (owner, 2026-11-14 20:18 CST), taken 2026-11-21 23:54 CST. It is undoable, and the owner may reopen it.

## See also

- `storage-keys-are-frozen` — the invariant that forbids renaming the namespace.
- `assets-and-icons` — why a changed icon forces a delete and re-add on iOS.
- `design-parchment-ledger` — the letterhead the masthead belongs to.
