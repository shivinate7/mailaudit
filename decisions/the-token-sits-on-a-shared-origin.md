# The token sits on a shared origin

**Status:** open.

`shivinate7.github.io` is one origin across every Pages repo. So script from any other project there can read `mailday-remote:v1`, where the token is stored. The fine-grained, single-repo, Contents-only scope and one token per device mitigate the risk. They do not eliminate it.

## See also

- `shared-origin-needs-namespace` — the same shared-origin risk, applied to the ledger keys
- `the-token-lives-outside-the-namespace` — the structural guard that keeps the token out of a sweep
- `the-token-is-a-credential` — the three guarantees that the token relies on, instead of scope alone
