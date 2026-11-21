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

## Phase 2: Original receipts (fleshed out)

**Point.** Keep each imported CSV exactly as it arrived. Link each ledger row to the file and line it came from. Refuse to guess when the export format changes. This builds on round 1's import receipt (the summary shown before merge) and adds three lines to it. It does not make a second import screen.

### Flow
1. The owner picks a CSV through the existing import.
2. **Fingerprint.** The app reads the header row, delimiter, quoting and a sample of date and price cells. It reduces them to a format id, e.g. `OW-2026a`.
3. **Known format** goes straight to the import receipt. **Unknown format** shows the drift hold in the receipt's own slot (screens below). Nothing merges until the owner confirms a column map.
4. **Hash.** The app takes a SHA-256 of the raw bytes. If a kept file already has that hash, the receipt reads "Already kept: orders-2026-10.csv (Oct 31). Nothing new." and merges nothing.
5. The receipt adds a line: "Source kept: orders-2026-11.csv · 212 KB · OW-2026a · parser 14 · 1,906 card rows, 311 filtered".
6. **Merge**, through the same merge path (never replace). Each new row gets a pointer to its source, its line number and the parser version. On a row already in the ledger, only "last seen in" moves.
7. The raw file goes to the Worker in the background, compressed. If the upload fails, the receipt's source line reads "kept on this device, uploading" and the upload retries at the next sync.
8. **Later, on any Packages or Tally row,** a detail pane shows "From orders-2026-11.csv, line 212 · parser 14". Tapping it shows the raw line beside the parsed fields.
9. **Re-read (later slice).** On the Sources screen, the owner re-reads one file with today's parser. The app shows a diff, such as "17 rows: price now includes the shipping column". The owner accepts or rejects each group of changes. Accepted changes go through the merge path. A re-read never touches check-in stamps, "claim filed", "refunded", or any orphaned package.

### Screens and states
**Drift hold** (it replaces the receipt panel at the same reserved height, so nothing moves under the pointer)
- Normal: "New export format. 14 of 16 columns match last time. 2 need you: `Item Price (USD)` → price? `Ship To` → not used?" The owner maps each one with in-app pickers. Cancel leaves the ledger untouched.
- Edge, a column was renamed: an exact-name match is never assumed for cost, quantity, order id or product name. Those four always need the owner's tap the first time they appear under a new name.
- Edge, extra columns only: the app shows them, marks them "ignored" by default, and saves the map for this fingerprint.
- Error, a required column is missing: "This file has no order number column. It can't be imported safely." The only action is Close. The file is not kept.

**Import receipt, source line** (a fixed one-line slot)
- Normal: "Source kept …" as in step 5.
- Edge: "Already kept … Nothing new." Or "Same rows, different bytes (line endings). Kept as a new source."
- Error: "Source not kept: device storage full. Rows still imported." This is shown in amber. The import is never blocked because the source copy failed.

**Sources screen** (Settings, then Sources)
- Empty: "No sources kept yet. Imports from now on keep their file. Rows imported earlier show 'before receipts'."
- Normal: a list of files newest first, each with date, size, format id, row counts and a sync dot.
- Edge: 400 or more files. The list groups by year, and each year shows "38 files · 2.1 MB".
- Edge: a file that exists only on another device shows "On server only". Opening it fetches the file.
- Error: if the Worker can't be reached, the list still shows from the local index, and actions that need the bytes say "Needs connection". No native dialogs anywhere. Delete and re-read confirm in an in-app sheet.

**Row provenance pane**
- Normal: file, line and parser, plus a "show raw line" toggle.
- Edge, legacy row: "Imported before receipts (2026-11). No source line." There is no error styling, because this is expected.
- Edge, a row seen in many overlapping exports: "First seen orders-2026-03.csv:88 · last seen orders-2026-11.csv:1,204".
- Error, the source bytes can't be fetched: "Source on server; offline." The parsed fields still show.

### Data, and the rule each item touches
| Item | Fields | Where | Rule touched |
|---|---|---|---|
| Source record | id, fileName, bytes size, sha256, importedAt, formatId, parserVersion, keptRows, filteredRows | new index | `storage-keys-are-frozen`: needs a new key or a Worker-only home |
| Source bytes | compressed raw file | Worker, plus a short-lived device copy | `the-token-is-a-credential`: the upload uses the device key; the key is never written into any record |
| Format record | formatId, header list, column map, confirmedAt | new index | same as the source record |
| Row pointer | srcFirst, lineFirst, srcLast, parserVersion | on each ledger row | `saved-state-shape`: needs an owner ruling; all four are optional and absent on legacy rows |
| Re-read diff | not stored | memory only | `imports-merge-never-replace`: applies only through merge |

Other rules it touches:
- `parser-filters`: the raw file still holds the filtered non-card rows. They live only in the source bytes and never reach a view, the Tally or a total.
- `orphaned-mail-never-decides`: provenance never attaches to an orphaned package, and a re-read never resolves one.
- `no-layout-shift-under-pointer`: the drift hold and the source line use reserved slots.
- `no-native-dialogs`: every confirm is an in-app sheet.

Size: compressed sources come to about 0.5 MB a year if each export covers one month, or about 6 MB a year if each covers the whole history. Both are estimates, not measured. Measure them on three real exports before slice 2.

### Smallest first slice: drift guard alone
- Fingerprint every import and keep the format record in memory and a constant. On an unknown format, show the drift hold. Never merge from an unmapped file.
- It adds no stored field, no storage key and no Worker change, so it needs no owner ruling.
- It ships alone and closes the worst ten-year failure: a changed export parsed quietly into wrong prices. Cost: one fingerprint function, one panel state, and tests on one known export and one renamed-column export.
- Slice 2: keep the bytes on the Worker, add the receipt source line and the Sources screen. This needs a ruling on the storage key.
- Slice 3: add the row pointers, the provenance pane and the re-read diff. This needs a ruling on the saved-state shape.

### Risks
- **Privacy.** The raw files hold shipping addresses and non-card purchases. Keeping them widens what a Worker leak exposes.
- **A re-read rewrites history.** A wrong parser fix applied broadly could shift the cost basis for years of rows. The diff must be grouped and accepted by the owner, never automatic.
- **Fingerprint too strict.** Cosmetic changes such as column order or a BOM could cause false holds, and the owner learns to tap through them. Mitigation: those changes are normalized out of the fingerprint.
- **Fingerprint too loose.** A change in date locale with the same headers could slip through. Mitigation: the sampled cell shapes are part of the fingerprint.
- **Overlapping exports.** The same row appears in many files. Without "first seen / last seen", the row pointers grow without limit.
- **Device copies lost to storage clearing.** A source not yet on the Worker can be lost. The receipt must show "uploading" until the Worker confirms it.

### Owner decisions (recommendation first)
1. **Where the bytes live.** Recommend: the Worker is the home of record, and the device copy is deleted once the upload is confirmed. The alternative is device and Worker both.
2. **Whole file or stripped.** Recommend: the whole file, byte for byte. A stripped copy can't prove what the marketplace said. The alternative is to drop the address columns before keeping it.
3. **Saved-state ruling for row pointers.** Recommend: allow the four optional fields, absent on legacy rows.
4. **New storage key for the source and format index.** Recommend: one new key, holding only the index, with the bytes on the Worker.
5. **Unknown format.** Recommend: hold until the owner maps the columns, and save that map for this fingerprint. The alternative is a best-guess import with a warning.
6. **Which files to keep.** Recommend: every file whose hash is new; compressed size makes it cheap. The alternative is to keep only files that brought new rows.
7. **What re-read may change.** Recommend: price, quantity and product name, only through the diff. Never order id, seller, or any check-in stamp.
