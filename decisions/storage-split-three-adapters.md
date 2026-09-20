# The component never touches a storage API directly

The application component never calls localStorage or IndexedDB itself. Every read and write goes through one of three adapters: storage, photos, or versions. The platform layer file is the only place either browser storage API may appear. This keeps every storage call in one file a test can mock.

## The argument, as recorded

```
`app.jsx` never touches a storage API directly — everything goes through
`window.storage`, `window.photos` or `window.versions`, and `entry.jsx` is the
only place localStorage or IndexedDB may appear.
```

## See also

- `versions-get-their-own-database` — why one of the three adapters gets its own database
- `single-file-architecture` — the file boundary these adapters live behind
- `the-token-lives-outside-the-namespace` — the credential kept outside all three adapters' namespace
