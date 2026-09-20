# The custom date range is picked, not typed

The custom range uses a month picker instead of a typed date field. iOS has no hyphen key on its numeric keypad, so a masked date field cannot be completed on the one device this app ships to. A month needs no keyboard, cannot express an invalid day, and avoids the width problem a native date pair caused. An exact-dates disclosure still covers the rare precise case.

## The argument, as recorded

```
**The custom range is picked, not typed.** Months are derived from the orders
the ledger actually contains, newest first. iOS's numeric keypad has no hyphen
key, so a masked `YYYY-MM-DD` field is uncompletable on the only device this
ships to; a month needs no keyboard, cannot express 2026-02-31, and makes the
~140px UA minimum width that collapsed the date range in the first place
irrelevant. The native pair survives behind an **Exact dates** disclosure for
the rare precise case. Reading the month off the ISO string is deliberate:
`Date.parse("2026-05-01")` is UTC midnight and `getMonth()` in any behind-UTC
zone rolls it back to April. Test 23.16 catches that; older M/D/YY exports parse
as *local* midnight and take the local-getter branch. All **seven** RANGES
options ship, laid out four to a row so they cost two rows rather than three.
```
