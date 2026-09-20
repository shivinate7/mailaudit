# The token used to span two repositories

**Status:** closed, by the `mailaudit-data` move.

A single token once needed write access to two separate repositories, widening what a leak could reach. Moving the ledger and photos into one private repo closed this thread. The token now covers exactly one repository again, with its blast radius shrunk to match.

## The thread, as recorded

```
- ~~**The token now spans two repos.**~~ **Closed by the `mailaudit-data`
  move.** The PAT covers exactly one repo again, which was the main thing the
  merge bought: `mailaudit` is public and the app never writes to it, so the
  shared-origin risk above now has a single private repo in its blast radius
  rather than two. Mitigation is unchanged — Contents-only scope, one token per
  device — it just covers less.
```

## See also

- `one-repo-for-both-halves` — the move that closed this thread
- `fine-grained-token-single-repo` — the scope the token now holds to
- `the-token-sits-on-a-shared-origin` — the mitigation that stayed unchanged
