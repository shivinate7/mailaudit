# Invariants are cited by slug

A record or a code comment cites an invariant by its slug, such as `parser-filters`, and never by a number. The invariants used to carry numbers 1 to 8 in the old CLAUDE.md. The records lost those numbers, and one number came to mean two different rules in two places. `check:records` fails a numbered cite in the records and in the comments of `src/`, `test/` and `build.mjs`. It also fails some tokens placed right after the word "invariant". These are a backticked span, or a bare kebab-case word with two or more hyphens. They fail when they are not one of the eight invariant slugs. A backticked slug within two edits of a real slug fails. Any other slug-shaped token far from every real slug is refused, not failed. An example is a truncated slug with no "invariant" before it. This is a known ceiling. Each invariant names the test that pins it, on a line that starts with "**Pinned by:**". That line must cite a test id or group that exists in `test/app.test.mjs`. It may instead cite `npm run check:screens` or an `npm run test:` script that exists. Bare `npm test` counts only beside a named id or group. A Pinned-by line with no real test fails. The owner ruled this on 2026-10-10.

**Holds while:** invariant records live in `invariants/` and `check:records` checks the cites and Pinned-by lines described above.

## See also

- `records-hold-current-text-only` — the other rule for what a record holds.
