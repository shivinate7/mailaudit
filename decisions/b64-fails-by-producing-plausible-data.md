# Base64 lives in its own module

The base64 helpers for the Contents API get their own file. A JPEG pushed through the wrong text path does not error. It silently produces corrupted bytes of the wrong length. That failure mode is worse than a thrown error, so the code stays pure and separately tested. The platform file cannot make this claim, because a test cannot load it.

## See also

- `photo-rules-fails-quietly` — the same reasoning applied to photo naming
- `remote-rules-fail-quietly` — the same reasoning applied to the remote adapter
- `merge-rules-only-add` — the same reasoning applied to the merge module
