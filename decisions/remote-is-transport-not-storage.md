# The remote adapter is transport, not storage

The remote adapter carries the ledger and now the photos to a private repository, but it speaks only ids and blobs. It never learns a filename. The naming rules live in a separate module, imported only by the platform layer. LocalStorage stays the source of truth, and the GitHub copy is a backup, so the app works fully offline.

## See also

- `photo-rules-fails-quietly` — the naming rules this adapter never learns
- `storage-split-three-adapters` — the local adapters this remote backs up
- `the-token-lives-outside-the-namespace` — the credential this transport uses without storing it as data
