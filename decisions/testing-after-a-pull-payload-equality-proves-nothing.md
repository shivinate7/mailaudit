# After a pull, payload equality proves nothing

A pull makes the local ledger identical to the remote one whether or not the push that followed actually landed. An assertion comparing payloads after a pull passes in both cases, so it proves nothing. The fix was to assert on the sha advancing instead, the one thing that tells the two outcomes apart.

## See also

- `testing-an-assertion-that-cannot-fail-is-decoration` — the general rule this specific case follows
- `merge-rules-only-add` — the pull and merge behavior this assertion was written to check
