# A pull needs the same key

**Status:** retired.

Sync no longer pulls from GitHub, and no device holds a GitHub token, so no pull needs a key (`worker-keeps-snapshots`).

Kind: process

Home: docs/decisions/records-hold-current-text-only.md

**Holds while:** no device holds a GitHub token (`live-verification`).

## See also

- `recovery-control-not-state-gated` — the rule that keeps the Sync row reachable on an empty ledger.
- `ruled-head-one-advisory-entrance` — the advisory line, which no longer names a GitHub key.
- `offline-is-decided-by-fetch` — how a failed fetch reads as offline.
