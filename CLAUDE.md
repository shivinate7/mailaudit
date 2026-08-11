# Mail Day Ledger

A single-page tool for verifying receipt of TCGplayer card orders. The user buys
hundreds of low-cost cards across many sellers; this app ingests OrderWand CSV
exports of their order history and gives them a checklist to mark cards as
received, see what's outstanding (and its dollar value), and flag possibly-lost
mail. Two views over the same check-in data: **Packages** (order + seller, the
mail-day working view) and **By item** (the same product name pooled across
every seller, for "did all four of these arrive?" and for cost basis).

Built iteratively in a Claude chat; this repo is the continuation point.

## Architecture

- `src/app.jsx` — the entire application, one React component file. No router,
  no CSS files (inline styles + one `<style>` tag for focus rules), Tailwind is
  NOT used. Dependencies: react, react-dom, papaparse only.
- `src/entry.jsx` — standalone entry: shims `window.storage` (an async
  get/set/delete/list API) onto localStorage, then mounts the app.
- `build.mjs` — bundles entry via esbuild and inlines the JS into a
  self-contained `index.html` (~189 KB) with iOS home-screen-app meta tags.
- `index.html` — the build output, committed to the repo. GitHub Pages serves it
  at https://shivinate7.github.io/mailaudit/ . The user runs it as an iOS
  home-screen web app.

### Dual-target constraint (important)

`src/app.jsx` doubles as a Claude.ai artifact (where `window.storage` is
provided by the platform). Keep it a single file with a default export, no
imports beyond react/papaparse, and never use localStorage/sessionStorage
directly inside it — always go through `window.storage`. The entry shim is the
only place localStorage may appear.

## Invariants — do not break these

1. **Storage keys are frozen.** App-level key `mailday:v1` (see STORAGE_KEY),
   shimmed under localStorage namespace `mailday:` → literal key
   `mailday:mailday:v1`. Real users have months of check-in data under these
   keys. Any schema change must ship with in-place migration in the load path.
2. **Saved-state shape:** `{ items, received, dateFilter, sortBy, itemSort,
   savedAt }`. `items` = array of parsed line items; `received` = map of item
   key → count received. Item key = `orderId|itemNumber|vendorProductId` —
   stable across re-imports; never change its construction. New keys must be
   optional and defaulted in the load path (as `itemSort` is), so saved states
   written by older builds keep loading. `itemSort` briefly shipped as
   `cardSort`; the load path still reads that key as a fallback.
3. **Imports MERGE, never replace.** TCGplayer only serves ~120 days of history,
   so this app is the system of record for older orders. Re-importing must keep
   every existing item and all `received` state, adding/refreshing by key.
4. **Parser filters:** keep only rows where Type is `purchase` (or blank) AND
   Vendor starts with `TCG`. The user's OrderWand exports now include eBay and
   seller-side rows; those must never enter the checklist. (Loosening to a
   vendor toggle is a known possible future feature — ask the user first.)
5. **No layout shift under the pointer while checking cards.** History: hiding a
   row on tap caused cascading mis-taps on mobile. Hence: under "Hide received",
   individually-checked rows stay visible ("sticky") until the package is fully
   received or filters change; sort order is snapshotted (frozen) while
   checking and re-computed only on sort/filter changes; packages never
   auto-collapse mid-interaction. In the by-item view the sticky rule is
   stricter — a *completed item* also stays until filters change, because most
   items have a single copy and vanishing on every tap would recreate exactly
   the mis-tap cascade this invariant exists to prevent.
6. **No native browser dialogs.** `window.confirm`/`alert` are blocked in the
   Claude artifact sandbox — the Reset button uses an inline two-tap confirm.
   Keep that pattern.

## OrderWand CSV schema & quirks (learned from the user's real exports)

Columns: Type, Vendor, Account, Order Id, Ordered At, Shipping Amount,
Tax Amount, Item Number, Product Name, Set Name, Set Code, Condition, Finish,
Price, Quantity, Total Amount, Currency, Product Line, Product Type, Party,
Shipping Status, Url, Vendor Product Id, Fee Amount, Refund Amount.

- `Party` = counterparty (seller on purchases). Older exports called it
  `Seller`; the parser accepts both.
- `Price` is per-unit (verified: Price × Quantity == Total Amount on all rows).
- Product/Set names contain HTML entities (`&amp;` etc.) — parser decodes.
- TCGplayer-Direct rows may put "Sold by X" in Set Name — parser blanks those.
- `Shipping Status` values: `with tracking`, `without tracking`, `unknown`,
  `canceled`. No tracking numbers or carrier data exist anywhere in the export.
- Dates are ISO in current exports; older exports used M/D/YY. `Date.parse`
  both.
- `Condition` = "unknown" on sealed product — parser blanks it.

## Feature map (all implemented)

Everything here is user-verified in daily use except the **By item** view and
cost basis, which are new in this build and so far verified only by the jsdom
harness described under Testing approach.

- Two views behind a Packages / By item switch at the top; both share one
  `received` map, the date filter, search, and Hide received.
- **By item view**: line items pooled by *exact* Product Name across every
  seller and order (TCGplayer names are a scrape, so duplicates are
  byte-identical — no normalization is done, deliberately). Each row shows
  `got/ordered`, cost basis, "N left · $Y", seller/order counts and the sets
  involved; expanding adds a "$X across N copies · $Y avg" line and lists every
  source copy (seller, date, set, order id) with the same tap-to-check and qty
  stepper as the package view, plus per-copy lost-mail flags. Counts and basis
  always cover every copy of the item even when Hide received or search filters
  the breakdown — a "N copies hidden by filters" note says so. Sort: most
  missing / biggest position / most ordered / $ remaining / name A–Z, frozen
  while checking and persisted as `itemSort`.
- **Cost basis** = Σ (Price × Quantity) over the item's non-canceled copies in
  the active date range. Shipping and tax are per-order columns in the CSV, not
  per-line, so they are deliberately not allocated into it. Basis is what was
  paid and never moves when copies are checked in; the red figure beside it is
  what's still outstanding.
- CSV import (drag/drop or picker), merge semantics, import summary notice.
- Packages grouped by orderId+seller; expand/collapse; per-package progress bar
  (only when partially complete); contextual "Mark all received" / "Clear
  check-ins"; rotated RECEIVED stamp replaces the count badge when complete.
- Whole-row tap to toggle; 2-line name wrap; qty stepper for qty>1 with
  indeterminate-dash partial state.
- Search (card/set/seller/order), Hide received, date filters (All/30/45/60/90,
  free "# days" input, custom from–to) — all shared by both views. Package sort
  (newest/oldest/$ remaining/seller A–Z) is separate from `itemSort`; the
  control swaps with the view. Both orders are frozen while checking.
- Outstanding value: overall "$X still missing", per-package and per-item
  "N left · $Y".
- Lost-mail flags on untracked unreceived packages: amber "may be lost" at 14d
  from order date, red "refund window closing" at 30d (TCGplayer refund
  eligibility ends 30 days after estimated delivery; order date is a
  conservative proxy since EDD isn't in the CSV).
- Canceled orders: excluded from list and all counts; viewable via
  "N canceled — view" link which scrolls to a dashed reference section (for
  refund auditing). Tracked/untracked shown as ●/○ dot + word in header meta.
- Backup button downloads full-state JSON (`{mailday:1, items, received,
  dateFilter, sortBy, itemSort}`); the file picker restores it (any `.json`
  routes to restore, `.csv` routes to import). Restore tolerates older backups
  missing the newer keys.
- Persistence auto-saves debounced 500ms with saved/saving indicator.

## Design language

"Postal ledger": cool paper background (#F4F5F2), pine ink (#1C2B24), stamp
green (#2E7D4F), signal red (#C0442B), manila (#EFE6CF/#7A6A3E), amber
(#A8720E). Monospace (system) for numbers/ids/labels, system sans for content.
No emoji in chrome except the empty-state 📬. Typographic dot indicators, not
icons. Max content width 760px; must work at 380px (iPhone). Touch targets:
whole-row tap, 30px check indicator, 34px steppers. The view switch is a
pill-shaped segmented control in uppercase mono, active segment filled with
pine ink — same treatment as the active date-range chip.

At iPhone width the by-item row is genuinely tight: the right-hand column holds
up to three lines (count, basis, outstanding) and the meta line under the name
truncates. It is ordered counts-first (`3 sellers · 3 orders · <sets>`) so the
long set list is what degrades to an ellipsis, never the counts. Keep that
ordering if you add anything to that line.

## Build & deploy

```
npm install
npm run build        # -> index.html
npm run deploy       # build + commit index.html + push (Pages auto-deploys)
```

GitHub Pages serves from main branch root. Deploy quirk learned the hard way:
if the Pages workflow sits Queued >10 min, don't re-run the same run — cancel
it and push a trivial commit to spawn a fresh run.

## Testing approach

No test framework is set up in this repo yet, and no harness is committed —
each one has been written ad hoc and thrown away. The recipe: bundle app.jsx
with esbuild (platform=node, format=cjs), boot in jsdom with a mocked
`window.storage`, seed saved state into that mock, drive clicks through
`react-dom/test-utils` `act`, assert on DOM text. Two gotchas worth
remembering: `navigator` can't be assigned onto Node's `global` (use
`Object.defineProperty` and skip failures), and jsdom holds the process open
unless you `window.close()` at the end. Worth formalizing (vitest +
testing-library) if development continues. Regression-sensitive behaviors to
always re-verify: sticky-row checking under Hide received, merge-on-reimport
preserving received state, backup/restore round-trip, canceled exclusion from
counts, frozen sort stability, and by-item totals and basis staying whole while
the breakdown is filtered.

`jsdom` is not a dependency — install it for a harness run with
`npm install jsdom --no-save` so package.json stays clean.

## Known open threads

- Vendor toggle (include eBay purchases) — user undecided, currently hard-filtered to TCG.
- Custom home-screen icon (apple-touch-icon needs a real PNG file in the repo).
- Possible migration to Netlify/Cloudflare for faster deploys (origin change
  = phone storage reset; requires Backup→restore flow; user aware).
- The Claude.ai artifact copy of app.jsx should be kept in sync when practical.
