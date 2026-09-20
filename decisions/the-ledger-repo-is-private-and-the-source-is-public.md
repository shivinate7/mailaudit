# The ledger repo is private, the source repo is public

**Status:** open.

The ledger and photos live in a private repo so a backup store never shares a repo with a public site. That choice costs a fresh device its keyless pull. Every device now needs a token before it can recover anything at all. `classifyLedger` carries the extra request that tells a hidden repo apart from an empty one, and that disambiguation is the ongoing cost of this design.

## The thread, as recorded

```
- **The ledger lives in `mailaudit-data`. `mailaudit` is PUBLIC.** This entry
  used to describe closing `mailaudit` itself as the cheap alternative to a
  `mailaudit-data` migration. That migration then happened anyway. The reason
  is one the original framing did not anticipate. **Private repos bill Actions
  minutes.** An unrelated repo on the account exhausted the allowance. That
  refused CI on a repo whose whole safety story rests on it. Moving the ledger
  out let the source repo go public. `.github/workflows/test.yml` and Pages
  are free again because of that.
  The data is not secret, and that was never the point. The ledger repo stays
  private for hygiene. A backup store does not belong in the repo that serves
  a public site. Measured anonymously after the move: Pages **200**, the repo
  API and the raw ledger URL both **404**.
  The price was always the price. **Keyless pull is gone.** A fresh device can
  no longer recover before it has been set up, and every device needs the
  token pasted. GitHub also hides a repo you cannot see behind a **404**.
  Every ledger read now has to tell that apart from a real "nothing pushed
  yet". Otherwise a keyless device is told a nonexistent ledger. The ledger is
  really sitting safely on a branch that device cannot read. That invites the
  device to push over it.
  `classifyLedger` does one extra `GET /repos/{owner}/{repo}` on the 404 path
  only. `pull`, `peek`, `listVersions` and `getVersion` all route through it.
  `no-access` is a `syncBroken` case with its own line. Group 38c. This is the
  same shape `listPhotos` has always had, inherited by the ledger the day it
  went private.
```

## The rest of the thread, as recorded

```
  `mailaudit-data` migration. That migration then happened anyway, for a reason
  the original framing did not anticipate: **private repos bill Actions minutes**,
  and an unrelated repo on the account exhausted the allowance, which refused CI
  on a repo whose whole safety story rests on it. Moving the ledger out let the
  source repo go public, so `test.yml` and Pages are free again.
  The data is not secret and never was the point — the ledger repo stays private
  for hygiene: a backup store does not belong in the repo that serves a public
  site. Measured anonymously after the move: Pages **200**, the repo API and the
  raw ledger URL both **404**.
  The price, which was always the price: **keyless pull is gone.** A fresh
  device can no longer recover before it has been set up, and every device needs
  the token pasted. And GitHub hides a repo you cannot see behind a **404**, so
  every ledger read now has to disambiguate that or a keyless device is told
  "no ledger has been pushed yet" about a ledger sitting safely on a branch it
  simply cannot read — an invitation to push over it. `classifyLedger` does one
  extra `GET /repos/{owner}/{repo}` on the 404 path only; `pull`, `peek`,
  `listVersions` and `getVersion` all route through it, and `no-access` is a
  `syncBroken` case with its own line. Group 38c. This is the same shape
  `listPhotos` has always had, inherited by the ledger the day it went private.
```

## See also

- `one-repo-for-both-halves` — why the ledger and photos share this one private repo
- `pull-needs-a-key-too` — the direct consequence of the repo going private
- `listphotos-is-three-valued` — the same 404-ambiguity shape, inherited here
- `nothing-recovers-without-the-key` — the fresh-device cost this decision creates
