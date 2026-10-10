# The ledger and the photos share one repo

The ledger and the photos share one private repo, `mailaudit-data`. The ledger sits on branch `data`. The photos sit on branch `main`, one file per photo, at `photos/<id>.<ext>`.

**Holds while:** `photoName` in `src/photo-rules.mjs` names the photo files, and `REMOTE` in `src/entry.jsx` names the `data` branch.

Privacy was the whole reason for two repos. A mailing label shows a delivery address. The ledger repo was public. That reason ended when the ledger repo went private.

The merge happened when `mailaudit` went public. The ledger had to leave it regardless. The merge buys one repo in the token's blast radius, not two. `shivinate7.github.io` is one origin across every Pages project. So the token must stay fine-grained, Contents-only, and single-repo.

Two other reasons once backed the split. Neither one holds now. "Git is permanent while the app repo is the one you clone" argued against photos in `mailaudit`. The ledger moved into the photo repo, so `mailaudit` got smaller. That argument never applied to this direction.

The GitHub 409 on rapid successive Contents writes is per-repo. It still holds, and the code handles it. See `photo-writes-wait-one-second`.

Push and Pull each do both legs in one tap. The ledger goes first, and the photos go after.

## See also

- `one-repo-for-both-halves` — why the source repo is public and holds no data.
- `fine-grained-token-single-repo` — the token scope that covers this one repo.
- `photo-branch-must-preexist` — the photo branch that must exist before any upload.
- `photo-sync-cannot-conflict` — why photo sync needs no sha at all.
- `photo-writes-wait-one-second` — the 409 rule that the shared repo still needs.
