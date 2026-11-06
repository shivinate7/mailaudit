# The device key sits on a shared origin

**Status:** open.

`shivinate7.github.io` is one origin across every Pages repo. So script from any other project there can read `mailday-sync:v1`, where the web device key is stored. A stored GitHub token, if any, sits there too, at `mailday-remote:v1`. One key per device mitigates the risk. It does not eliminate it.

Kind: process

Home: invariants/the-token-is-a-credential.md

**Holds while:** the device key sits at `mailday-sync:v1` (`SYNC_KEY_STORAGE` in `src/sync-rules.mjs`) on the shared `shivinate7.github.io` origin.

## See also

- `shared-origin-needs-namespace` — the same shared-origin risk, applied to the ledger keys
- `token-lives-outside-namespace` — the structural guard that keeps the device key out of a sweep
- `the-token-is-a-credential` — the invariant that makes the device key and any stored token credentials
