# Tests feed files through the drop handler

Tests feed a file to the app through its drop handler. They do not set the file input's `files` property. Setting `input.files` is not practical in jsdom.

**Holds while:** the drop helper in `test/harness.mjs` defines `dataTransfer` on a plain `Event`, and `csv()` builds an OrderWand-shaped file.

Build an `Event("drop")`. Attach the files with `Object.defineProperty` as `dataTransfer`. The same helper carries a CSV. `csv()` builds the OrderWand-shaped file. papaparse reads it as a real Blob through jsdom's `FileReader`. The app routes on the file name. The MIME type must still match the extension.

## See also

- `harness-jsdom-setup-gotchas`, the other jsdom limits a test meets.
- `orderwand-csv`, the file format `csv()` builds.
- `two-device-merge-proven-first`, the merge that a restored file can feed.
