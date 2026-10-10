# Invariants are cited by slug

A record or a code comment cites an invariant by its slug, such as `parser-filters`, and never by a number. The invariants used to carry numbers 1 to 8 in the old CLAUDE.md. The records lost those numbers, and one number came to mean two different rules in two places. `check:records` fails a numbered cite in the records and in the comments of `src/`, `test/` and `build.mjs`. It also fails a token placed right after the word "invariant" that is not one of the eight invariant slugs. A backticked slug that is a near miss of a real slug fails. A slug-shaped token that is far from every real slug is refused, not failed. Each invariant names the test that pins it, on a line that starts with "**Pinned by:**". That line must cite a test id or group that exists in `test/app.test.mjs`, or a script that runs tests. A Pinned-by line with no real test fails. The owner ruled this on 2026-10-10.

**Holds while:** invariant records live in `invariants/` and `check:records` resolves every backticked slug.

## See also

- `records-hold-current-text-only` — the other rule for what a record holds.
