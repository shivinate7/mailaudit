# The GitHub data repo holds the frozen history and the photo source

The private repo `mailaudit-data` holds the frozen ledger history on branch `data`. It also holds the GitHub photo files on branch `main`, one file per photo, at `photos/<id>.<ext>`. That is the source of the one-time photo copy. Since the switch, no device writes the ledger there. Web photos go to the Worker, see `sync-revamp-cloudflare`.

**Holds while:** `photoName` in `src/photo-rules.mjs` names the photo files, and `REMOTE` in `src/entry.jsx` names the `data` branch.

Privacy was the whole reason for two repos. A mailing label shows a delivery address. The ledger repo was public. That reason ended when the ledger repo went private.

The merge happened when `mailaudit` went public. The ledger had to leave it regardless. Before that, `mailaudit` held the ledger on its own `data` branch, which is why it had to stay private. Moving the ledger out let the source repo go public. `shivinate7.github.io` is one origin across every Pages project. So the token must stay fine-grained, Contents-only, and single-repo. See `token-sits-on-shared-origin`.

The GitHub 409 on rapid successive Contents writes was a reason too. It retired with the GitHub photo writes, see `photo-writes-wait-one-second`.

On the web, a ledger POST goes first, and the photo push follows it. Neither takes a tap. The Push control left the UI on 2026-10-12.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md

## See also

- `one-repo-for-both-halves` — why the source repo is public and holds no data.
- `fine-grained-token-single-repo` — the token scope that covers this one repo.
- `token-sits-on-shared-origin` — why the token scope must stay narrow.
- `photo-branch-must-preexist` — the GitHub photo branch that the copy reads.
- `photo-sync-cannot-conflict` — why photo sync needs no sha at all.
