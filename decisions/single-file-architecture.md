# One component file, one platform layer

The whole application lives in one React component file, with no router and no CSS framework. A separate platform layer file gives the browser storage and network APIs a single home. This split still holds. It keeps the app testable through the DOM and keeps every storage and network call in one place a test can mock.

## See also

- `storage-split-three-adapters` — the storage rule this platform layer file enforces
- `versions-get-their-own-database` — one of the three adapters this split gives its own home
