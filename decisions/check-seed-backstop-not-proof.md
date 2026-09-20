# Check the built seed by decoding it, not by reading the code

A leaked stamp note was found by decoding the built page and searching it, never by reading the source. That hand check runs after every change here, because it is the only way to know what actually got published. The automated check does the same grep and fails on any key outside the allow list. It is a backstop against known leaks, not proof against every leak, so the hand check stays the instruction.

## The argument, as recorded

```
The stamp-note leak was found by decoding the built page and grepping it, not
by reading the code. **Do that after any change here** — it is the only way to
know what you actually published. `npm run check:seed` is that grep written
down, and CI runs it on every push: it decodes the committed page's seed and
fails on any key outside `SEED_KEEP` or any surviving stamp `note`. Its
allow-list is `SEED_KEEP` itself rather than a copy, so widening the seed
widens the gate in the same edit — deliberately, since that edit is where the
thinking should happen. It is a backstop, not a proof: it can only refuse the
leaks someone already thought of, which is why the hand grep stays the
instruction.
```

## See also

- `check-build-ignores-seed` — the other half of the same check, on whether the page is this repository's code
- `the-public-seed` — what the seed is allowed to publish
- `seed-load-guards` — the guards on the other end, when the seed loads
