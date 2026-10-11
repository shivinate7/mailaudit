# Lost-mail flags count from the order date

An untracked, unreceived package gets an amber "may be lost" flag at 14d from the order date. It gets a red "refund window closing" flag at 30d from the order date.

**Holds while:** `lostMail` in `src/view-rules.mjs` counts from the date it is passed, which `parseItems` reads from the `ordered at` column. It flags at 14 and 30 days, and reads no estimated-delivery column. V2.1 to V2.3 in `test/view-rules.test.mjs` pin both tiers and the quiet case under 14 days.

TCGplayer refund eligibility ends 30 days after the estimated delivery date (EDD). The CSV has no EDD column. So the order date is a conservative proxy for that missing date.

## See also

- `stamped-package-hides-lost-flag` — the case that suppresses this flag.
- `one-stamp-per-package` — the record that decides if the case above applies.
