# A changed behaviour changes its test in the same commit

A behaviour that changes on purpose changes its assertion and its prose in one commit. This keeps each claim and its test in step. Read the record that holds the claim before you change the behaviour. That record names the assertion to update.

**Holds while:** `test/app.test.mjs` opens each group with a banner. The banner is `/* ── N.` or `/* ---- N.`. Each assertion is labelled with its id, such as `42.3` or `38b.4`.

To find the record that holds a group's claim, search the records for the group number or the test id. The home record of a group names the group number. `npm run check:records` reads the same banners. If an invariant cites a renamed group, the check fails.

## See also

- `invariants-cited-by-slug` — invariants name the test that pins them, by slug
- `testing-partial-qty-needs-case` — the partial-quantity case that group 20 holds
- `testing-chokepoint-two-branches` — the lesson group 37 taught
