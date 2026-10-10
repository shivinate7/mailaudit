# Base64 lives in its own module

The base64 helpers for the Contents API get their own file, `src/b64.mjs`. A JPEG pushed through the wrong text path does not error. It silently produces corrupted bytes of the wrong length. That failure is worse than a thrown error, so the code stays pure and tested on its own. `entry.jsx` cannot load in a test, so the platform file cannot make this claim.

- `bytesToBase64` is the shared core.
- `utf8ToBase64` and `base64ToUtf8` are the ledger's text path.
- `blobToBase64` is the photo path.

A JPEG is not UTF-8. Pushing one through the text encoder mangles every byte that is not valid UTF-8, and it changes the length. Test 31.21 asserts this.

Photos need only an encoder. The pull asks for the raw media type and reads `arrayBuffer()`, so photo bytes never reach base64 on the way back.

## See also

- `photo-rules-fails-quietly` — the same reasoning applied to photo naming
- `remote-rules-fail-quietly` — the same reasoning applied to the remote adapter
- `merge-rules-only-add` — the same reasoning applied to the merge module
