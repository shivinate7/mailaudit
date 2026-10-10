# Lost-mail flags count from the order date

An untracked, unreceived package gets an amber "may be lost" flag at 14d from the order date. It gets a red "refund window closing" flag at 30d from the order date.

TCGplayer refund eligibility ends 30 days after the estimated delivery date (EDD). The CSV has no EDD column. So the order date is a conservative proxy for that missing date.

## See also

- `a-stamped-package-hides-the-lost-mail-warning` — the case that suppresses this flag.
- `one-stamp-per-package` — the record that decides if the case above applies.
