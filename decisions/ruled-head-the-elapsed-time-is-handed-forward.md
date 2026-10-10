# Hand the elapsed time forward, never re-derive it

The resume handler must pass its own measured away-time to the merge check, instead of letting a later effect read a cleared timestamp. The handler runs first and nulls its own clock, so a naive reader would always measure zero and the merge would silently never fire. A signal variable carries the finding across the gap instead.

## See also

- `ruled-head-a-resume-counts-as-reopening` — the resume behavior this signal drives.
- `peek-is-three-valued` — the read that consumes this signal.
