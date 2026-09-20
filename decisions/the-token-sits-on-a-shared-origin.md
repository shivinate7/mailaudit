# The token sits on a shared origin

**Status:** open.

`shivinate7.github.io` serves every Pages project on the account from one origin. Script from any other project there could read the stored key. The fine-grained, single-repo, Contents-only scope limits what a leak could reach, but it does not remove the exposure.

## The thread, as recorded

```
- **The token sits on a shared origin.** `shivinate7.github.io` is one origin
  across every Pages repo, so script from any other project there can read
  `mailday-remote:v1`. Mitigated by the fine-grained, single-repo,
  Contents-only scope and one token per device — not eliminated.
```

## See also

- `shared-origin-needs-namespace` — the same shared-origin risk, applied to the ledger keys
- `the-token-lives-outside-the-namespace` — the structural guard that keeps the token out of a sweep
- `the-token-is-a-credential` — the three guarantees the token relies on instead of scope alone
