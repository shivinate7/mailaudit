# Remote sync never touches the save indicator

The local save runs on its own debounced path, with a 500ms debounce and a saved or saving indicator. Remote sync sits deliberately outside that path. No remote error, of any kind, ever touches `saving`.

**Holds while:** only the local save effect in `src/app.jsx` calls `setSaving`, on a 500ms debounce.

## See also

- `unwritable-store-says-so` — a failure this local save must not inherit.
- `offline-is-decided-by-fetch` — the check that decides if remote sync can run at all.
