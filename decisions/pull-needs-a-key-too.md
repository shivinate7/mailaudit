# Pull Now Needs The Same Key

Since the ledger repo went private, pull needs the same fine-grained token that push already required. A fresh device with no key can no longer recover on its own before setup. The app treats this as its own broken-sync case with its own message, rather than a plain error buried in a panel.

## The argument, as recorded

```
Push needs a fine-grained PAT (`Contents: read & write`, that repo
  only) pasted once per device — and since the repo went private, **pull needs
  that key too**. This used to read "pull needs no key at all", which was the
  property that let a fresh device recover before it had been set up; closing
  the world-readable ledger cost exactly that, knowingly. A device with no key
  can now do nothing remote at all, which is why `no-access` is a `syncBroken`
  case with its own line rather than an error buried in a panel.
```

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the rule that keeps Pull reachable anyway.
- `ruled-head-one-advisory-line-is-the-only-entrance` — the line that leads to Pull.
- `offline-is-decided-by-fetch` — the read a keyless pull still depends on.
