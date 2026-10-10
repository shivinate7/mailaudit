# The masthead is not the project name

The app presents itself as **MANIFEST**, under a C.H Postal Company letterhead. The project name stays Mail Day Ledger. The repo keeps `mailaudit`, and the storage namespace keeps `mailday:`. None of those may follow the masthead. See invariant 1. Real check-in data sits under those keys.

**Holds while:** `build.mjs` sets the page title to `Manifest` and the iOS title to `Mail Day`, and `STORAGE_KEY` in `src/app.jsx` is `mailday:v1`.

The browser `<title>` in `build.mjs` is "Manifest". The `apple-mobile-web-app-title` stays "Mail Day" on purpose. iOS bakes that label in at install time. Changing it forces a delete and re-add of the home-screen icon. This mismatch is intentional. Do not fix it without asking.

## See also

- `storage-keys-are-frozen` — the invariant that forbids renaming the namespace.
- `assets-and-icons` — why a changed icon forces a delete and re-add on iOS.
- `design-parchment-ledger` — the letterhead the masthead belongs to.
