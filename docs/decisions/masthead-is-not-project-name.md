# The masthead is not the project name

The app presents itself as **MANIFEST**, under a C.H Postal Company letterhead. The project name stays Mail Day Ledger. The repo keeps `mailaudit`, and the storage namespace keeps `mailday:`. None of those may follow the masthead. See `storage-keys-are-frozen`. Real check-in data sits under those keys.

**Holds while:** `build.mjs` sets the page title to `Manifest` and the iOS title to `CH Post`, `STORAGE_KEY` in `src/app.jsx` is `mailday:v1`, and `CFBundleDisplayName` in `native/project.yml` is `CH Post`.

The browser `<title>` in `build.mjs` is "Manifest". The `apple-mobile-web-app-title` is "CH Post" (owner, 2026-11-21 17:05 CST, "change that too"). iOS bakes that label in at install time, so a web app already on the home screen keeps its old label until the owner deletes it and adds it again from Safari. The label differs from the browser title on purpose. Do not fix it without asking.

The native app's home-screen label is also **CH Post** (owner, 2026-11-21 17:02 CST): `CFBundleDisplayName` in `native/project.yml`. The bundle id, product name, scheme and the in-app masthead stay as they were.

## See also

- `storage-keys-are-frozen` — the invariant that forbids renaming the namespace.
- `assets-and-icons` — why a changed icon forces a delete and re-add on iOS.
- `design-parchment-ledger` — the letterhead the masthead belongs to.
