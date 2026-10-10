# A build needs the data remote to seed the page

A fresh clone needs a git remote that points at the private data repository. The data branch must be fetched before the build can bake in a seed. Without that remote, the build runs seedless. The seed checker reports that rather than failing outright.

**Holds while:** `build.mjs` reads the seed through `SEED_REF`, from the `ledger` remote. When that ref resolves, `--check-seed` fails a seedless page.

On a machine where the remote does resolve, a seedless committed page is a hard failure. This means that the build dropped a seed it could have made.

## Setup

A clone needs a remote named `ledger` for the seed to build:

```bash
git remote add ledger https://github.com/shivinate7/mailaudit-data.git && git fetch ledger data
```

Without the remote, the build is seedless. `npm run check:seed` reports that instead of failing. On a machine where the ref does resolve, a seedless committed page is a hard failure. The build dropped a seed it could have made.

## See also

- `the-public-seed` — what the seed this remote supplies actually contains
- `check-build-ignores-seed` — the check that reports a seedless build
- `data-branch-setup` — the branch this remote must fetch
