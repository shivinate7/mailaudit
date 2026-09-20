# A build needs the data remote to seed the page

A fresh clone needs a git remote pointing at the private data repository. It must be fetched for the data branch before the build can bake in a seed. Without that remote, the build runs seedless. The seed checker reports that rather than failing outright. On a machine where the remote does resolve, a seedless committed page is a hard failure. That means the build dropped a seed it could have made.

## The argument, as recorded

```
A clone also needs a remote named `ledger` for the seed to build:
```bash
git remote add ledger https://github.com/shivinate7/mailaudit-data.git && git fetch ledger data
```
Without it the build is seedless, and `npm run check:seed` says so rather than
failing — but on a machine where the ref *does* resolve, a seedless committed
page is a hard failure, because that means the build dropped a seed it could
have made.
```
