# Photo rules are pure and separately tested

Photo naming, the already-there check, and the sync plan all live in one pure module. They carry the image type inside the filename. They read the raw status rather than a folded error code, and they compute a three-valued set difference. Each of these decisions fails quietly when wrong, so the module stays pure and gets direct tests instead of trust.

## The argument, as recorded

```
- `src/photo-rules.mjs` — the photo-sync rules, same rationale as the two below:
  naming (`photoName`/`photoIdFromName`/`mimeFromName` — the image type has to
  survive in the filename, because a raw GET answers with GitHub's media type,
  not the file's), `isAlreadyThere` (keyed on the raw **status**, not the
  classified code, since `classifyStatus` folds a sha-less 422 and a throttling
  409 into the same `conflict` and they mean opposite things), and `photoPlan`
  (the set difference, three-valued on the remote). Imported by `entry.jsx` for
  naming and by `app.jsx` for `photoPlan` — one of the **three** local-module
  imports in `app.jsx` (the others are `merge-rules.mjs` and
  `version-rules.mjs`), whose dependencies are otherwise react, react-dom and
  papaparse.
```

## See also

- `b64-fails-by-producing-plausible-data` — the same reasoning, on the base64 module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `merge-rules-only-add` — the same reasoning, on the merge module
- `remote-is-transport-not-storage` — the adapter these naming rules serve
