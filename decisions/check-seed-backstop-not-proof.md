# Check the built page, not the code that builds it

Kind: build

Plan: decisions/check-seed-backstop-not-proof.md#the-check (web)

The stamp-note leak was found by decoding the built page and grepping it. It was not found by reading the code. Run that check after any change here. It is the only way to know what you actually published.

**Holds while:** `npm run check:seed` runs `build.mjs --check-seed`, and `test.yml` runs `check:seed` in its `suite` job.

## The check

`npm run check:seed` refuses three shapes in the committed `index.html`:

- a `<script id="seed">` tag
- a packed data script, `type="application/gzip-base64"`
- a ledger payload, `{"mailday":1,`

CI runs it on every push. It has no allow list. A shape it does not name passes.

The check is a backstop, not a proof. It can refuse only the leaks that someone already thought of. The hand grep stays the instruction.

## See also

- `the-public-seed` — the removal this check now backstops
- `check-build-ignores-seed` — retired; `check:build` compares the whole page
- `seed-load-guards` — retired with the seed load
