# Base64 lives in its own module

The base64 helpers for the Contents API get their own file. A JPEG pushed through the wrong text path does not error. It silently produces corrupted bytes of the wrong length. That failure mode is worse than a thrown error, so the code stays pure and separately tested. The platform file cannot make this claim, because a test cannot load it.

## The argument, as recorded

```
- `src/b64.mjs` — base64 for the Contents API: `bytesToBase64` is the shared
  core, `utf8ToBase64`/`base64ToUtf8` the ledger's text path, and
  `blobToBase64` the photo path. A JPEG is not UTF-8 — pushing one through the
  text encoder mangles every byte that isn't valid UTF-8 and changes its length
  (measured, and asserted in 31.21). Only an encoder is needed for photos: the
  pull asks for the raw media type and reads `arrayBuffer()`, so photo bytes
  never round-trip through base64 coming back. Its own module
  because it is the one piece here that fails by producing *plausible corrupted
  data* rather than an error, and `entry.jsx` can't be loaded from a test.
```
