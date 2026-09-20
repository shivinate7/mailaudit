# The file protocol supports everything the app needs

Opening the built page straight off disk works, because both localStorage and IndexedDB, blobs included, were measured to work under the file protocol. The local static server exists only to match the production scheme, which matters when chasing a bug tied to the origin.

## The argument, as recorded

```
Opening `index.html` straight off disk works — `file://` was **measured**
supporting localStorage *and* IndexedDB (Blobs included), so nothing the app
needs is missing there. `npm run serve` exists only to give a scheme matching
production, which matters if you're chasing an origin-dependent bug.
```
