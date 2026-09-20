# The OrderWand CSV schema and quirks

This file holds the CSV column list and every quirk found in the user's real OrderWand exports. Read it before touching the parser. No decision or invariant record owns this material, and the parser depends on every line of it.

## Schema and quirks

````
## OrderWand CSV schema & quirks (learned from the user's real exports)

Columns: Type, Vendor, Account, Order Id, Ordered At, Shipping Amount,
Tax Amount, Item Number, Product Name, Set Name, Set Code, Condition, Finish,
Price, Quantity, Total Amount, Currency, Product Line, Product Type, Party,
Shipping Status, Url, Vendor Product Id, Fee Amount, Refund Amount.

- `Party` = counterparty (seller on purchases). Older exports called it
  `Seller`; the parser accepts both.
- `Price` is per-unit (verified: Price × Quantity == Total Amount on all rows).
- Product/Set names contain HTML entities (`&amp;` etc.) — parser decodes.
  **So do seller names** (`Party`): the user's real export contains
  `LT's Hobbies&amp;Games2`. That one was missed for a long time because `ITEMS`
  in the harness is *pre-parsed*, so nothing exercised `parseItems` at all;
  group 29 is the first test that drives a CSV through it. A raw entity there
  leaks into the package header, Tally's source rows, and the search haystack —
  where it fails silently, since searching what's on screen then matches
  nothing.
- TCGplayer-Direct rows may put "Sold by X" in Set Name — parser blanks those.
- `Shipping Status` values: `with tracking`, `without tracking`, `unknown`,
  `canceled`. No tracking numbers or carrier data exist anywhere in the export.
- Dates are ISO in current exports; older exports used M/D/YY. `Date.parse`
  both.
- `Condition` = "unknown" on sealed product — parser blanks it.
````

## See also

- `parser-filters`, the invariant that keeps only TCG purchase rows.
- `imports-merge-never-replace`, why a re-import must not drop older orders.
- `saved-state-shape`, the item key built from these columns.
