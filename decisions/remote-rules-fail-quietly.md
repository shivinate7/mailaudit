# Remote status mapping is pure and tested

Two adapter decisions get their own pure functions. One maps GitHub's status codes to an error code the UI can phrase. The other chooses when a push body omits the sha. Both fail quietly when wrong, the same reasoning that governs the base64 module, so both stay pure and directly tested.

## See also

- `b64-fails-by-producing-plausible-data` — the same reasoning, on the base64 module
- `photo-rules-fails-quietly` — the same reasoning, on the photo-sync module
- `merge-rules-only-add` — the same reasoning, on the merge module
