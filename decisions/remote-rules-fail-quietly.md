# Remote status mapping is pure and tested

Two adapter decisions get their own pure functions, in `src/remote-rules.mjs`. Both are worth asserting on.

**Holds while:** `src/remote-rules.mjs` exports `classifyStatus` and `pushBody`, and `test/app.test.mjs` imports both.

- `classifyStatus` maps GitHub's overloaded status codes to an error code the UI can phrase.
- `pushBody` chooses when a push body omits the sha. It omits the sha only on a create.

Both fail quietly when wrong. That is the same reasoning that governs the base64 module (`b64.mjs`). So both stay pure and directly tested.

## See also

- `b64-fails-with-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `merge-rules-only-add` — the same reasoning, on the merge module
