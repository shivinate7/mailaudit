# Photo rules are pure and separately tested

Photo naming, the already-there check, and the sync plan all live in one pure module. They carry the image type inside the filename. They read the raw status rather than a folded error code, and they compute a three-valued set difference. Each of these decisions fails quietly when wrong, so the module stays pure and gets direct tests instead of trust.

## See also

- `b64-fails-by-producing-plausible-data` — the same reasoning, on the base64 module
- `remote-rules-fail-quietly` — the same reasoning, on the remote adapter
- `merge-rules-only-add` — the same reasoning, on the merge module
- `remote-is-transport-not-storage` — the adapter these naming rules serve
