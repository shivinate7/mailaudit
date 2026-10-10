# Check the built seed by decoding it, not by reading the code

The stamp-note leak was found by decoding the built page and grepping it. It was not found by reading the code. Run that check after any change here. It is the only way to know what you actually published.

**Holds while:** `npm run check:seed` runs `build.mjs --check-seed`, and its allow list is `SEED_KEEP` in `build.mjs`. `test.yml` runs `check:seed` in its `suite` job.

`npm run check:seed` is that grep, written down. CI runs it on every push. It decodes the committed page's seed. It fails on any key outside `SEED_KEEP`, or on any surviving stamp `note`.

The allow list is `SEED_KEEP` itself, not a copy. So widening the seed widens the gate in the same edit. That is deliberate. The edit is where the thinking should happen.

The check is a backstop, not a proof. It can refuse only the leaks that someone already thought of. The hand grep stays the instruction.

## See also

- `check-build-ignores-seed` — the other half of the same check, on whether the page is this repository's code
- `the-public-seed` — what the seed is allowed to publish
- `seed-load-guards` — the guards on the other end, when the seed loads
