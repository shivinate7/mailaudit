# Envelope names match after normalizing

Names typed into an envelope match ledger names only after both pass through `normName`.

**Holds while:** `normName` in `src/view-rules.mjs` normalizes with NFD, strips the combining marks, lowercases, and collapses non-alphanumeric runs. V3.1 and V3.2 in `test/view-rules.test.mjs` pin the curly and the straight apostrophe.

`normName` is required. iOS smart punctuation turns a typed `'` into `’`. The CSV keeps a straight apostrophe. Without normalizing, a name with an apostrophe would never match the ledger.

## See also

- `orphan-entry-takes-one-input` — where the typed names come from.
- `orderwand-csv` — the CSV that keeps a straight apostrophe.
- `orphaned-mail-never-decides` — the limit that applies to any match.
