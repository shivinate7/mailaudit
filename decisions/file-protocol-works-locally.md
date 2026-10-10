# The file protocol supports everything the app needs

Opening `index.html` straight off disk works. Measured under the `file://` protocol, localStorage and IndexedDB both work, Blobs included. So nothing the app needs is missing there.

`npm run serve` exists only to give a scheme that matches production. That matters when a bug depends on the origin.

## See also

- `every-origin-has-own-storage` — why the file origin is a separate ledger from the others
- `testing-jsdom-has-no-layout` — why this claim needed a real browser, not a test
