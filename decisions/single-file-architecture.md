# One component file, one platform layer

The whole application lives in one React component file, with no router and no CSS framework. A separate platform layer file gives the browser storage and network APIs a single home. This split still holds. It keeps the app testable through the DOM and keeps every storage and network call in one place a test can mock.

## The argument, as recorded

```
- `src/app.jsx` — the entire application, one React component file. No router,
  no CSS files (inline styles + one `<style>` tag for focus rules, the
  masthead and the action row), Tailwind is NOT used. Dependencies: react, react-dom, papaparse only.
- `src/entry.jsx` — the platform layer. Provides `window.storage` (async
  get/set/delete/list over localStorage, holding the ledger),
  `window.photos` (async put/get/delete/keys/clear/sweep/usage over IndexedDB,
  holding envelope photos), `window.versions` (put/list/get/remove/prune/usage
  over its **own** IndexedDB database, holding gzipped ledger snapshots) and
  `window.remote` (target/status/setKey/clearKey/
  pull/push/pushForce over the GitHub Contents API), then mounts the app.
```
