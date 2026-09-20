# A public seed hydrates a visitor's empty ledger

The site and the ledger repository are different artifacts. The site is public, but the ledger is not, so an empty visitor could see nothing but the masthead. A build-time snapshot, baked into the page itself, closes that gap without reopening the private repository. The snapshot publishes only order ids, seller names, card names, prices and dates. It withholds envelopes and stamp notes, because those hold hand-typed sender and tracking details.

## The argument, as recorded

```
The site is public and the ledger repo is not, and **those are different
artifacts** — Pages serves `main` root and has never served the `data` branch.
So sharing the URL used to hand someone the app with nothing in it: their
browser's localStorage is their own and empty, and the fetch for the ledger
404s. Measured, on the live site with storage cleared: the whole page was the
masthead and "Drop your OrderWand CSV here".

The seed closes that without reopening the repo. A snapshot is baked **into
`index.html`** at build time, so a visitor gets the app and the data in one
public file, hydrates into their own storage, and can do as they like with it.
They still cannot push — that needs a token they do not have, which was always
true and was never the gap.

**What is published is exactly `SEED_KEEP`** — `items`, `received`, `stamps`,
and the three view preferences. That is order ids, seller names, card names,
prices and dates: the substance of the ledger, and the point of sharing it.
What is withheld: **`envelopes` entirely** (hand-typed notes, where CLAUDE.md
has always said tracking numbers and sender names end up), and **stamp `note`
text** (the kind and date stay, so the status band still reads). Photos never
went near the ledger. Widen `SEED_KEEP` only on purpose — the Pages site is
world-readable and git is permanent.
```

## See also

- `check-seed-backstop-not-proof` — the check that verifies what this seed actually publishes
- `seed-load-guards` — the guards that keep this seed off a keyed device
- `ledger-remote-needed-for-seed-build` — the remote a build needs to bake this seed in
