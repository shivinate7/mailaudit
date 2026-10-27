# Base64 lives in its own module

The base64 helpers for the Contents API get their own file, `src/b64.mjs`. A JPEG pushed through the wrong text path does not error. It silently produces corrupted bytes of the wrong length. That failure is worse than a thrown error, so the code stays pure and tested on its own. The app suite does not load `entry.jsx`; only `test/photoget.test.mjs` bundles it, with the app stubbed. So the helpers stay out of the platform file, where the app suite can reach them.

**Holds while:** `src/b64.mjs` exports `utf8ToBase64` and `blobToBase64` as separate functions. Test 31.21 in `test/app.test.mjs` asserts the JPEG case.

- `bytesToBase64` is the shared core.
- `utf8ToBase64` and `base64ToUtf8` are the ledger's text path.
- `blobToBase64` is the photo path.

A JPEG is not UTF-8. Pushing one through the text encoder mangles every byte that is not valid UTF-8, and it changes the length. Test 31.21 asserts this.

Photos need only an encoder. The pull asks for the raw media type and reads `arrayBuffer()`, so photo bytes never reach base64 on the way back.

**Pinned by:** 31.21 for the JPEG case, and 30.7 for the photo round trip. The harness mocks encode through the real `src/b64.mjs` functions. Test 30.7 asserts that the bytes come back identical. Swapping in the text encoder turns it red.

Groups 25 to 27 confirm red a mutant that replaces `utf8ToBase64` with `btoa`. A fixture alone would miss that mutant. Every item in `ITEMS` is pure ASCII.

Group 25's non-ASCII round trip goes through an envelope entry. iOS smart punctuation enters the app there. It changes no counts.

Kind: build

Plan: docs/decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-rules-fails-quietly` — the same reasoning applied to photo naming
- `remote-rules-fail-quietly` — the same reasoning applied to the remote adapter
- `merge-later-change-wins` — the same reasoning applied to the merge module
