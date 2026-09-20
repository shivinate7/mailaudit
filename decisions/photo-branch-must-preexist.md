# The photo branch must exist before any upload

Photos live on the data repository's main branch, in a photos directory, and that branch must already hold a commit before any Contents API write. A write into a repository with no commits is not a path worth relying on, so it starts with a README if recreated. Privacy is not optional here, because these are pictures of mailing labels carrying a delivery address.

## The argument, as recorded

```
3. The photos live on `mailaudit-data`'s **`main`**, in `photos/`. That branch
   must exist before any Contents PUT — a PUT into a repo with no commits is not
   a path worth relying on, so initialise with a README if recreating. Private is
   not optional: these are pictures of mailing labels with the delivery address
   on them.
```

## See also

- `data-branch-setup` — the sibling setup step for the ledger branch
- `one-repo-for-both-halves` — the repository both branches share
- `remote-is-transport-not-storage` — the adapter that writes into this branch
