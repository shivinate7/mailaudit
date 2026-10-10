# Pull now needs the same key

Since the ledger repo went private, pull needs the same fine-grained token that push already required. A fresh device with no key can no longer recover on its own before setup. The app treats this as its own broken-sync case with its own message, rather than a plain error buried in a panel.

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the rule that keeps Pull reachable anyway.
- `ruled-head-one-advisory-line-is-the-only-entrance` — the line that leads to Pull.
- `offline-is-decided-by-fetch` — the read a keyless pull still depends on.
