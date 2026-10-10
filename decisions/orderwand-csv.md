# The OrderWand CSV schema and quirks

This record holds the CSV column list and every quirk found in the user's real OrderWand exports. Read it before you change the parser. No decision or invariant record holds this material, so this record is its only home. The parser depends on every line here.

**Holds while:** `parseItems` in `src/app.jsx` reads `party` with `seller` as fallback, and decodes HTML entities in names.

## Schema and quirks

These quirks were learned from the user's real exports.

The header row has these columns, in this order: `Type, Vendor, Account, Order Id, Ordered At, Shipping Amount, Tax Amount, Item Number, Product Name, Set Name, Set Code, Condition, Finish, Price, Quantity, Total Amount, Currency, Product Line, Product Type, Party, Shipping Status, Url, Vendor Product Id, Fee Amount, Refund Amount`.

- `Party` is the counterparty. On purchases, it is the seller. Older exports called it `Seller`. The parser accepts both.
- `Price` is per unit. This is verified: Price × Quantity == Total Amount on all rows.
- Product and set names contain HTML entities, such as `&amp;`. The parser decodes them. Seller names (`Party`) need the same decoding. The user's real export contains `LT's Hobbies&amp;Games2`. That case was missed for a long time. The harness fixture `ITEMS` is pre-parsed, so no test ran `parseItems`. Group 29 is the first test that drives a CSV through it. A raw entity in a seller name leaks into the package header, Tally's source rows, and the search haystack. There, the search fails silently. Searching what is on screen then matches nothing.
- TCGplayer-Direct rows can put "Sold by X" in Set Name. The parser blanks those.
- `Shipping Status` values are `with tracking`, `without tracking`, `unknown`, and `canceled`. The export holds no tracking numbers or carrier data.
- Dates are ISO in current exports. Older exports used M/D/YY. `Date.parse` reads both.
- `Condition` is "unknown" on sealed product. The parser blanks it.

## See also

- `parser-filters`, the invariant that keeps only TCG purchase rows.
- `imports-merge-never-replace`, why a re-import must not drop older orders.
- `saved-state-shape`, the item key built from these columns.
