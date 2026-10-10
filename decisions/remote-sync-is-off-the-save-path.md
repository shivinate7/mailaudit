# Remote sync never touches the save indicator

The local save runs on its own debounced path, with a 500ms debounce and a saved or saving indicator. Remote sync sits deliberately outside that path. No remote error, of any kind, ever touches `saving`.

## See also

- `a-store-that-cannot-write-says-so` — a failure this local save must not inherit.
- `offline-is-decided-by-fetch` — the check that decides if remote sync can run at all.
