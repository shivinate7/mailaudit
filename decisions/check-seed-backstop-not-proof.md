# Check the built seed by decoding it, not by reading the code

A leaked stamp note was found by decoding the built page and searching it, never by reading the source. That hand check runs after every change here, because it is the only way to know what actually got published. The automated check does the same grep and fails on any key outside the allow list. It is a backstop against known leaks, not proof against every leak, so the hand check stays the instruction.

## See also

- `check-build-ignores-seed` — the other half of the same check, on whether the page is this repository's code
- `the-public-seed` — what the seed is allowed to publish
- `seed-load-guards` — the guards on the other end, when the seed loads
