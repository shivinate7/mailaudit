# A public seed hydrates a visitor's empty ledger

The site and the ledger repository are different artifacts. The site is public, and the ledger is not. Pages serves the `main` root and has never served the `data` branch.

**Holds while:** `SEED_KEEP` in `build.mjs` names `items`, `received`, `stamps`, `dateFilter`, `sortBy` and `itemSort`, and not `envelopes`.

Sharing the URL alone gives a visitor the app with nothing in it. Their browser's localStorage is their own and empty. The fetch for the ledger 404s. Measured on the live site with storage cleared, the whole page was the masthead and "Drop your OrderWand CSV here".

The seed closes that gap without reopening the repo. A snapshot is baked into `index.html` at build time. A visitor gets the app and the data in one public file. The visitor hydrates into their own storage and can do as they like with it. They still cannot push. Pushing needs a token they do not have. That was always true, and it was never the gap.

## What the seed publishes

Exactly `SEED_KEEP` is published. That is `items`, `received`, `stamps`, and the three view preferences. It is order ids, seller names, card names, prices and dates. That data is the point of sharing the ledger.

These are withheld:

- **`envelopes` entirely.** Envelopes hold hand-typed notes. The project file says that tracking numbers and sender names are written there.
- **Stamp `note` text.** The kind and date stay, so the status band still reads.

Photos never went near the ledger.

Widen `SEED_KEEP` only on purpose. The Pages site is world-readable, and git is permanent.

## See also

- `check-seed-backstop-not-proof` — the check that verifies what this seed actually publishes
- `seed-load-guards` — the guards that keep this seed off a keyed device
- `ledger-remote-needed-for-seed` — the remote a build needs to bake this seed in
