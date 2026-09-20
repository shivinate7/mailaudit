# The remote adapter is transport, not storage

The remote adapter carries the ledger and now the photos to a private repository, but it speaks only ids and blobs. It never learns a filename. The naming rules live in a separate module, imported only by the platform layer. LocalStorage stays the source of truth, and the GitHub copy is a backup, so the app works fully offline.

## The argument, as recorded

```
**`window.remote` is transport, not storage.** It now carries photos as well
as the ledger, to a second (private) repo — but still speaks only ids and
blobs: `app.jsx` never learns a filename, exactly as it never learns the string
`"ledger.json"`. The naming rules live in `src/photo-rules.mjs` and are
imported only by `entry.jsx`.
 localStorage remains the source
of truth; the GitHub copy is a backup and the app is fully functional offline.
```
