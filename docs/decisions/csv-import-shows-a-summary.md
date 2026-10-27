# A CSV import shows a summary

A CSV import works by drag and drop, or by the file picker. The import merges into the ledger. Then the app shows a summary notice.

**Holds while:** `src/app.jsx` writes "Imported N lines across your orders." after a CSV import.

The merge rules sit in `imports-merge-never-replace`. The summary states how many lines the import read.

## See also

- `imports-merge-never-replace` — the merge rule that every import follows.
- `parser-filters` — which rows the import keeps.
- `orderwand-csv` — the CSV schema and quirks the import reads.
