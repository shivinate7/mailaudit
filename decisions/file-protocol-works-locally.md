# The file protocol supports everything the app needs

Opening the built page straight off disk works, because both localStorage and IndexedDB, blobs included, were measured to work under the file protocol. The local static server exists only to match the production scheme, which matters when chasing a bug tied to the origin.

## See also

- `every-origin-has-own-storage` — why the file origin is a separate ledger from the others
- `testing-jsdom-has-no-layout` — why this claim needed a real browser, not a test
