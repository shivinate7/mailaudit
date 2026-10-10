# A build needs the data remote to seed the page

A fresh clone needs a git remote pointing at the private data repository. It must be fetched for the data branch before the build can bake in a seed. Without that remote, the build runs seedless. The seed checker reports that rather than failing outright. On a machine where the remote does resolve, a seedless committed page is a hard failure. That means the build dropped a seed it could have made.

## See also

- `the-public-seed` — what the seed this remote supplies actually contains
- `check-build-ignores-seed` — the check that reports a seedless build
- `data-branch-setup` — the branch this remote must fetch
