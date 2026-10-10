# Invariants are cited by slug

A record or a code comment cites an invariant by its backticked slug, such as `parser-filters`, and never by a number. The invariants used to carry numbers 1 to 8 in the old CLAUDE.md. The records lost those numbers, and one number came to mean two different rules in two places. A slug cite is checked by `check:records`, so a wrong cite fails. Each invariant also names the test that pins it, on a line that starts with "**Pinned by:**". A Pinned-by line with no real test fails. The owner ruled this on 2026-10-10.

**Holds while:** invariant records live in `invariants/` and `check:records` resolves every backticked slug.

## See also

- `records-hold-current-text-only` — the other rule for what a record holds.
