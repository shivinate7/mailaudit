# The token sits on a shared origin

**Status:** open.

`shivinate7.github.io` serves every Pages project on the account from one origin. Script from any other project there could read the stored key. The fine-grained, single-repo, Contents-only scope limits what a leak could reach, but it does not remove the exposure.

## See also

- `shared-origin-needs-namespace` — the same shared-origin risk, applied to the ledger keys
- `the-token-lives-outside-the-namespace` — the structural guard that keeps the token out of a sweep
- `the-token-is-a-credential` — the three guarantees the token relies on instead of scope alone
