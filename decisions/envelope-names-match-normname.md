# Envelope names match after normalizing

Names typed into an envelope match ledger names only after both pass through `normName`.

**Holds while:** `normName` in `src/app.jsx` normalizes with NFD, strips the combining marks, lowercases, and collapses non-alphanumeric runs.

`normName` is required. iOS smart punctuation turns a typed `'` into `’`. The CSV keeps a straight apostrophe. Without normalizing, a name with an apostrophe would never match the ledger.

## See also

- `orphan-entry-takes-one-input` — where the typed names come from.
- `orderwand-csv` — the CSV that keeps a straight apostrophe.
- `orphaned-mail-never-decides` — the limit that applies to any match.
