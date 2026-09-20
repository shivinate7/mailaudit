# Lost-mail flags count from the order date

An untracked, unreceived package gets an amber flag at fourteen days and a red flag at thirty days, both counted from the order date. TCGplayer's refund window actually closes thirty days after estimated delivery, a date missing from the CSV. Order date stands in as a conservative proxy for that missing date.

## The argument, as recorded

```
- Lost-mail flags on untracked unreceived packages: amber "may be lost" at 14d
  from order date, red "refund window closing" at 30d (TCGplayer refund
  eligibility ends 30 days after estimated delivery; order date is a
  conservative proxy since EDD isn't in the CSV).
```

## See also

- `a-stamped-package-hides-the-lost-mail-warning` — the case that suppresses this flag.
- `one-stamp-per-package` — the record that decides if the case above applies.
