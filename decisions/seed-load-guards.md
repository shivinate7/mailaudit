# The seed load guards are retired

Kind: build

Plan: decisions/seed-load-guards.md#retired (web)

**Status:** retired 2026-10-14 with `the-public-seed`. Nothing loads a seed, so there is no load to guard. Any future seed needs its own guard against a keyed device, and git keeps the text of this one.

**Holds while:** `src/app.jsx` and `src/entry.jsx` load no seed, and the committed `index.html` carries no seed tag (test 38d.5).

## Retired

Nothing here applies. The removed load had no guard that a current path still needs.

## See also

- `the-public-seed` — the removal this retirement follows
