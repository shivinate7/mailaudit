# Ten years from now

Premises (all from the brief; unchecked, because the brief rules out reading the repo's code and docs):
- Imports are CSV exports of order history, and the export format will change. (brief) unknown
- Phones get replaced and copies sync through one small private server. (brief) unknown
- Sellers disappear and card names change over the years. (brief) unknown
- Scale reaches tens of thousands of rows. (brief) unknown
- Failing premises: none found. These directions assume nothing about the current storage shape.

## Original receipts: keep every import as it came in
- **Idea:** Store each imported CSV byte for byte. Record a hash, the import date, and the parser version that read it. Each ledger row points back to the file and line it came from. When the export format changes, the app spots a header set it has never seen. It then shows a column-mapping screen instead of guessing. A later parser fix can re-read old files and show the difference before it applies anything.
- **Who and why now:** The owner in year 7, when a 2026 cost looks wrong. Today the parser is the only witness to what the marketplace said. If the marketplace changes its format before the raw files are kept, the original wording is lost for good.
- **Shape:** A "Sources" list shows each file's date, row count, format version and parser version. Tapping a row opens "came from file X, line 212". The data needed is the raw text plus a row-to-source pointer. At this scale the raw text is a few MB.
- **Risks:** The raw files may hold shipping addresses, so keeping them grows what a leak exposes. A re-parse could silently rewrite settled history, so it must show a diff and wait for the owner.
- **Owner decides:** keep whole files or strip some columns; whether a re-parse may touch closed years (see Closing a year).

## Card identity that survives renames
- **Idea:** A card keeps a stable identity inside the app. Every name and set label it has had is attached to that identity. The marketplace product id anchors it when the export has one. Otherwise the owner joins two names: "Ashen Drake (Promo)" and "Ashen Drake [PRM-04]" become one card. Each join is its own record and can be undone.
- **Who and why now:** The Tally view in year 5. Without identity, "did all four arrive" and the cost basis split quietly across two names. Renames build up every year, so early joins are cheap and late ones are archaeology.
- **Shape:** Tally flags "3 names look like the same card", and the owner confirms or rejects each one. The card page lists its name history with dates. The data needed is an identity table, an alias list and join events.
- **Risks:** A wrong join merges cost basis. An automatic join on fuzzy names is the likely mistake, so fuzzy matches only suggest.
- **Owner decides:** whether a product-id match joins automatically; whether undoing a join restores the old Tally exactly.

## Closing a year
- **Idea:** After a set time (say 120 days past the latest order date), each order of a year has a final outcome: received, lost and refunded, or lost and written off. The owner then closes the year. Its totals freeze and the app makes a one-page summary: spend, cards, loss rate, refunds, sellers. The live views load only open periods, so they stay fast at tens of thousands of rows. This is also where the record forgets on purpose. A closed year drops its per-tap check-in events and keeps each order's outcome and date.
- **Who and why now:** The owner who opens the app on mail day in 2034 and wants this month, not 2026. Also anyone who must trust a total, because a late re-import can no longer move a closed number quietly. It shows as an amendment line instead.
- **Shape:** "2027: 4,812 cards, $1,903.40, 1.9% lost. Closed 2028-02-01." A banner shows "1 amendment since close".
- **Risks:** Forgetting cannot be undone; a closed year with an orphaned package that is never resolved.
- **Owner decides:** the grace period; which detail is dropped at close; whether a closed year can be reopened, and by what act.

## Seller record that outlives the seller
- **Idea:** Each seller gets a record keyed on the marketplace's seller id, not the shop name. It holds the shop's name history, first and last order, typical days in transit, loss rate, and a "gone quiet" mark after a year with no orders. The "may be lost" flag uses that seller's own history and the season, not one fixed delay.
- **Who and why now:** Mail-day judgement ("Brightmoor Cards always takes 11 days, so don't flag yet"), and the owner years later asking "who were my reliable sellers?" Shop names get reused and changed, so keying on the name mixes two shops into one.
- **Shape:** A seller page with a small transit-time strip and a list of losses. A flag says "late for this seller" instead of "late".
- **Risks:** The export may not carry a seller id, so this is unknown until a real CSV is checked. Small samples can make a careful seller look bad.
- **Owner decides:** the minimum number of orders before a per-seller delay replaces the default.

## A copy anyone can read without MANIFEST
- **Idea:** Once a year (and at each close), write a self-describing bundle: plain CSVs, a short README that explains each column, the sealed summaries, and optional photos. It should open in any spreadsheet in 2036 without this app, this server or this phone. Next to it runs a yearly restore check: a fresh device rebuilds the data from the bundle alone, and the app reports pass or fail.
- **Who and why now:** The owner after the third phone or a dead server, and an heir, insurer or tax preparer who values the collection. Today recovery depends on a device key and a live server. The bundle is the copy that depends on neither.
- **Shape:** A "Year bundle ready, save it" prompt with one button. Restore check: "2026-11 bundle restored 18,240 rows, totals match."
- **Risks:** A plain copy is a privacy leak wherever it lands. Photos make it large. A restore check that reads from the live data instead of the bundle proves nothing.
- **Owner decides:** where the bundle goes (email to self, cloud drive, print); photos in or out; whether an heir needs any instructions in the README.

Strongest: Original receipts — every other direction (identity joins, re-parsing after a format change, trusted closed years, a readable copy) depends on still having what the marketplace actually said, and that is the one thing that cannot be rebuilt later.
