# Pull now needs the same key

Push needs a fine-grained personal access token. It needs `Contents: read & write`, scoped to that repo only. The key is pasted once per device. Since the ledger repo went private, pull needs that key too.

Closing the ledger repo cost one property, knowingly. A fresh device can no longer recover before it is configured with a key. A device with no key can now do nothing remote at all. So `no-access` is a `syncBroken` case with its own line. It is not an error buried in a panel.

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the rule that keeps Pull reachable anyway.
- `ruled-head-one-advisory-line-is-the-only-entrance` — the line that leads to Pull.
- `offline-is-decided-by-fetch` — the read a keyless pull still depends on.
