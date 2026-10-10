# The ledger repo is private, the source repo is public

**Status:** open.

The ledger and photos live in a private repo. So a backup store never shares a repo with a public site. That choice has a cost. Keyless pull is gone. A fresh device cannot recover until it has a token. Every device needs its token pasted in before it can recover anything at all. `classifyLedger` carries the extra request that tells a hidden repo apart from an empty one. That disambiguation is the ongoing cost of this design.

The ledger lives in `mailaudit-data`. `mailaudit` is PUBLIC. Closing `mailaudit` itself was the cheap alternative to a `mailaudit-data` migration. The migration happened anyway, for a reason the original framing did not anticipate. **Private repos bill Actions minutes.** An unrelated repo on the account used up the allowance. That refused CI on a repo whose whole safety story rests on it. Moving the ledger out let the source repo go public. So the `test.yml` workflow (`.github/workflows/test.yml`) and Pages are free again.

The data is not secret, and that was never the point. The ledger repo stays private for hygiene. A backup store does not belong in the repo that serves a public site. Measured anonymously after the move, Pages returns 200. The repo API and the raw ledger URL both return 404.

The price was always the price. GitHub hides a repo you cannot see behind a 404. So every ledger read must tell that 404 apart from a real "nothing pushed yet". Otherwise a keyless device would be told that no ledger exists. In fact, the ledger sits safely on a branch that device cannot read. That would invite the device to push over it. `classifyLedger` does one extra `GET /repos/{owner}/{repo}` on the 404 path only. `pull`, `peek`, `listVersions` and `getVersion` all route through it. `no-access` is a `syncBroken` case with its own line. Group 38c covers this. This is the same shape `listPhotos` has always had. The ledger inherited it on the day the repo went private.

## See also

- `one-repo-for-both-halves` — why the ledger and photos share this one private repo
- `pull-needs-a-key-too` — the direct consequence of the repo going private
- `listphotos-is-three-valued` — the same 404-ambiguity shape, inherited here
- `nothing-recovers-without-the-key` — the fresh-device cost this decision creates
