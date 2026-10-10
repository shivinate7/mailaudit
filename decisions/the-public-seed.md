# A public seed hydrates a visitor's empty ledger

The site and the ledger repository are different artifacts. The site is public, but the ledger is not, so an empty visitor could see nothing but the masthead. A build-time snapshot, baked into the page itself, closes that gap without reopening the private repository. The snapshot publishes only order ids, seller names, card names, prices and dates. It withholds envelopes and stamp notes, because those hold hand-typed sender and tracking details.

## See also

- `check-seed-backstop-not-proof` — the check that verifies what this seed actually publishes
- `seed-load-guards` — the guards that keep this seed off a keyed device
- `ledger-remote-needed-for-seed-build` — the remote a build needs to bake this seed in
