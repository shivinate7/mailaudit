# One component file, one platform layer

The whole application lives in one React component file, `src/app.jsx`. It has no router and no CSS files. It uses inline styles, plus one `<style>` tag for focus rules, the masthead and the action row. Tailwind is not used. Its only dependencies are react, react-dom and papaparse.

**Holds while:** `package.json` lists only react, react-dom and papaparse as dependencies, and `src/app.jsx` holds the application.

A separate platform layer, `src/entry.jsx`, gives the browser storage and network APIs a single home. It provides these objects:

- `window.storage`: async get, set, delete and list over localStorage. It holds the ledger.
- `window.photos`: async put, get, delete, keys, clear, sweep and usage over IndexedDB. It holds envelope photos.
- `window.versions`: put, list, get, remove, prune and usage over its own IndexedDB database. It holds gzipped ledger snapshots.
- `window.remote`: target, status, setKey, clearKey, pull, push and pushForce over the GitHub Contents API.

Then it mounts the app.

This split still holds. It keeps the app testable through the DOM. It also keeps every storage and network call in one place that a test can mock.

## See also

- `storage-split-three-adapters` — the storage rule this platform layer file enforces
- `versions-get-their-own-database` — one of the three adapters this split gives its own home
