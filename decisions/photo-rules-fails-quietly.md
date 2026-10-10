# Photo rules are pure and separately tested

The photo-sync rules live in `src/photo-rules.mjs`. Their rationale matches the other pure modules. Each of these decisions fails quietly when wrong. So the module stays pure, and it gets direct tests instead of trust.

**Holds while:** `src/photo-rules.mjs` exports `photoName`, `photoIdFromName`, `mimeFromName`, `isAlreadyThere` and `photoPlan`, and `src/app.jsx` imports exactly three local modules.

The module holds three rules:

- Naming: `photoName`, `photoIdFromName`, and `mimeFromName`. The image type has to survive in the filename. A raw GET answers with GitHub's media type, not the file's own type.
- `isAlreadyThere`: keyed on the raw **status**, not the classified code. `classifyStatus` folds a sha-less 422 and a throttling 409 into the same `conflict`. They mean opposite things.
- `photoPlan`: the set difference, three-valued on the remote.

`entry.jsx` imports the module for naming. `app.jsx` imports it for `photoPlan`. That makes it one of the **three** local-module imports in `app.jsx`. The other two are `merge-rules.mjs` and `version-rules.mjs`. Otherwise, `app.jsx` depends only on react, react-dom and papaparse.

## See also

- `b64-fails-with-plausible-data` — the same reasoning, on the base64 module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `merge-rules-only-add` — the same reasoning, on the merge module
- `remote-is-transport-not-storage` — the adapter these naming rules serve
