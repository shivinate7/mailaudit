# Mail Day Ledger

A single-page tool for verifying receipt of TCGplayer card orders. The user buys
hundreds of low-cost cards across many sellers; this app ingests OrderWand CSV
exports of their order history and gives them a checklist to mark cards as
received, see what's outstanding (and its dollar value), and flag possibly-lost
mail. Three views over the same check-in data: **Packages** (order + seller,
the mail-day working view), **By item** (the same product name pooled across
every seller, for "did all four of these arrive?" and for cost basis), and
**Mystery mail** (packages that arrive with no way to tell who sent them).

## Architecture

- `src/app.jsx` — the entire application, one React component file. No router,
  no CSS files (inline styles + one `<style>` tag for focus rules), Tailwind is
  NOT used. Dependencies: react, react-dom, papaparse only.
- `src/entry.jsx` — the platform layer. Provides `window.storage` (async
  get/set/delete/list over localStorage, holding the ledger) and
  `window.photos` (async put/get/delete/keys/clear/sweep/usage over IndexedDB,
  holding envelope photos), then mounts the app.
- `build.mjs` — bundles entry via esbuild and inlines the JS into a
  self-contained `index.html` with iOS home-screen-app meta tags.
- `index.html` — the build output, committed to the repo. GitHub Pages serves it
  at https://shivinate7.github.io/mailaudit/ . The user runs it as an iOS
  home-screen web app.
- `test/harness.mjs` + `test/app.test.mjs` — the behaviour suite (`npm test`).
- `dev-server.mjs` — optional local static server (`npm run serve`).

### Storage split (important)

`app.jsx` never touches a storage API directly — everything goes through
`window.storage` or `window.photos`, and `entry.jsx` is the only place
localStorage or IndexedDB may appear. Keep them apart: the ledger is one small
JSON blob that has to save on a 500ms debounce, and photos are megabytes that
must never get near it. localStorage caps out around 5MB; IndexedDB scales with
free disk and stores Blobs without base64's ~33% inflation.

Note `shivinate7.github.io` is a single origin across every repo the user has
on Pages — hence the `mailday:` key namespace, and hence a per-origin storage
quota shared with any other Pages project.

## Invariants — do not break these

1. **Storage keys are frozen.** App-level key `mailday:v1` (see STORAGE_KEY),
   shimmed under localStorage namespace `mailday:` → literal key
   `mailday:mailday:v1`. Real users have months of check-in data under these
   keys. Any schema change must ship with in-place migration in the load path.
2. **Saved-state shape:** `{ items, received, envelopes, dateFilter, sortBy,
   itemSort, savedAt }`. `items` = array of parsed line items; `received` = map
   of item key → count received; `envelopes` = mystery-mail records, each
   `{ id, createdAt, note, entries: [{ name, qty }], photos: [photoId] }`.
   Item key = `orderId|itemNumber|vendorProductId` — stable across re-imports;
   never change its construction. Envelope entries store card **names**, never
   item keys, so a re-import can't rot them and newly imported older orders
   become candidates for free.
   New keys must be optional and defaulted in the load path (as `itemSort`,
   `envelopes` and `photos` are), so saved states written by older builds keep
   loading. `itemSort` briefly shipped as `cardSort`; the load path still reads
   that key as a fallback. Adding a persisted key means touching **five** sites:
   the load effect, the save payload + its dep array, `backup`, the JSON restore
   branch, and `resetAll` — miss the last one and the next debounced save writes
   the stale value straight back. Photo *blobs* are not in here at all; only
   their ids are (see Envelope photos below).
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
6. **No native browser dialogs.** `window.confirm`/`alert` block the whole page
   and look wrong in a home-screen app; every destructive action uses an inline
   two-tap confirm instead (Reset, Discard, Assign). Keep that pattern. (This
   started as a sandbox limitation and outlived it — it's now a UI choice.)
7. **Mystery mail never decides anything.** The user buys the same cheap cards
   from many sellers, so *near-duplicate packages are normal* — two outstanding
   orders can have identical contents. The app may rank the packages an envelope
   could have come from; it must never auto-assign, never treat a perfect
   fingerprint match as an action, and never check off a card the user didn't
   record (no "mark the rest of the package too"). Equally-good candidates are
   reported as a tie and rendered without emphasis. This constraint came
   directly from the user — don't "simplify" it away as friction.

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

Everything here is user-verified in daily use except the **By item** view, cost
basis, **Mystery mail** and **envelope photos**, which are newer and so far
verified only by `npm test`. The camera path in particular has never run on a
real iPhone.

- Three views behind a Packages / By item / Mystery mail switch at the top. The
  first two share one `received` map, the date filter, search, and Hide
  received; Mystery mail hides all of those (they apply to nothing there) but
  keeps Re-import / Backup / Reset reachable. The switch survives an empty
  ledger so pending envelopes can't be stranded, and carries a count badge when
  envelopes are waiting.
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
- **Mystery mail**: for packages that arrive with no way to tell who sent them.
  *Record an envelope* → one autofocused input, suggestions drawn from cards
  still outstanding (`outstandingNames`), tap to add (tap again bumps qty), the
  input clears and keeps focus so the iOS keyboard never dips; the return key
  or an "Add … as typed" row records anything not in the ledger. Optional note
  (tracking #, sender) and optional photos, neither of which blocks the fast
  path. Saved envelopes sit in a pile, newest first, and touch nothing in the
  ledger.
  Each pending envelope lists the outstanding packages that could explain it
  (`rankCandidates`), best first, with how much each explains; a two-tap confirm
  checks in *exactly the recorded cards* and nothing else. Unexplained entries
  are tagged "no outstanding copy" and stay behind in a smaller envelope that
  keeps its id/createdAt/note. Per-envelope Edit and two-tap Discard. The last
  assignment is undoable, with the notice rendered at the vacated slot in the
  pile rather than at the top of the page.
  Name matching goes through `normName` (NFD-strip accents, lowercase, collapse
  non-alphanumerics) — required because iOS smart punctuation turns a typed `'`
  into `’`, which would otherwise never equal the CSV's straight apostrophe.
  Candidates ignore the date filter on purpose (a mystery envelope is as likely
  to be an old order) and exclude canceled orders. They're derived, never
  stored, so a package received by other means simply stops being offered.
  See invariant 7 for what this must never do.
- **Envelope photos** (a snap of the mailing label, so a tracking number or
  sender survives without typing it). `<input capture="environment">` opens the
  iOS camera directly; the image is canvas-downscaled to a 2000px long edge at
  JPEG 0.8 — big enough to *read* a label, small enough not to matter — and
  written straight to IndexedDB. Envelopes carry only photo ids; the blob never
  enters the ledger JSON. Thumbnails on the card, tap for a full-screen viewer.
  Object URLs are revoked on unmount (leaking them pins whole images in memory
  for the life of the page).
  Nothing deletes photos implicitly, so a single **sweep** effect covers every
  orphan path at once (discard, assign-away, restore, a cancelled composer): it
  drops any blob no envelope references, held off while an undo is live or a
  composer is open, since either can bring ids back. A "N photos stored · X of
  Y used on this device" line in the pile reports real
  `navigator.storage.estimate()` numbers.
- CSV import (drag/drop or picker), merge semantics, import summary notice.
- Packages grouped by orderId+seller; expand/collapse; per-package progress bar
  (only when partially complete); contextual "Mark all received" / "Clear
  check-ins"; rotated RECEIVED stamp replaces the count badge when complete.
- Whole-row tap to toggle; 2-line name wrap; qty stepper for qty>1 with
  indeterminate-dash partial state.
- Search (card/set/seller/order), Hide received, date filters (All/30/45/60/90,
  free "# days" input, custom from–to) — shared by the two ledger views and
  hidden entirely under Mystery mail. Package sort (newest/oldest/$ remaining/
  seller A–Z) is separate from `itemSort`; the control swaps with the view.
  Both orders are frozen while checking.
- Outstanding value: overall "$X still missing", per-package and per-item
  "N left · $Y".
- Lost-mail flags on untracked unreceived packages: amber "may be lost" at 14d
  from order date, red "refund window closing" at 30d (TCGplayer refund
  eligibility ends 30 days after estimated delivery; order date is a
  conservative proxy since EDD isn't in the CSV).
- Canceled orders: excluded from list and all counts; viewable via
  "N canceled — view" link which scrolls to a dashed reference section (for
  refund auditing). Tracked/untracked shown as ●/○ dot + word in header meta.
- **Two backups.** *Backup* downloads `{mailday:1, items, received, envelopes,
  dateFilter, sortBy, itemSort}` — small, quick, and holds the irreplaceable
  part. *Backup + photos* (only shown when photos exist) adds `photos` as an
  `{id: dataURL}` map; photos are memory aids, so paying their file size is
  opt-in. The file picker restores either (any `.json` routes to restore,
  `.csv` routes to import) and tolerates older backups missing newer keys.
  Restoring a photo-less backup **strips** envelopes' photo ids rather than
  leaving them pointing at blobs that exist nowhere. A restore is a full
  replace, so if pending envelopes are about to be replaced the notice says so —
  they're hand-typed and losing them silently would be the worst kind of quiet.
- Persistence auto-saves debounced 500ms with saved/saving indicator.

## Design language

"Postal ledger": cool paper background (#F4F5F2), pine ink (#1C2B24), stamp
green (#2E7D4F), signal red (#C0442B), manila (#EFE6CF/#7A6A3E), amber
(#A8720E). Monospace (system) for numbers/ids/labels, system sans for content.
No emoji in chrome except the empty-state 📬. Typographic dot indicators, not
icons. Max content width 760px; must work at 380px (iPhone). Touch targets:
whole-row tap, 30px check indicator, 34px steppers. The view switch is a
pill-shaped segmented control in uppercase mono, active segment filled with
pine ink — same treatment as the active date-range chip. Three segments plus the
envelope count badge only just fit at 375px, which is why the pill padding is
`8px 14px` rather than 16 — don't lengthen a label without re-checking.

Mystery mail follows the same language: manila for anything advisory (the
ambiguity warning, the "as typed" row, the "no outstanding copy" tag), stamp
green only on an exact match and the armed check-in confirm, signal red only on
Discard. Photo thumbnails are 56px squares; the viewer is a full-screen pine-ink
scrim, tap anywhere to dismiss.

At iPhone width the by-item row is genuinely tight: the right-hand column holds
up to three lines (count, basis, outstanding) and the meta line under the name
truncates. It is ordered counts-first (`3 sellers · 3 orders · <sets>`) so the
long set list is what degrades to an ellipsis, never the counts. Keep that
ordering if you add anything to that line.

## Build & deploy

```
npm install
npm run build        # -> index.html
npm test             # behaviour suite, must be green before deploying
npm run serve        # optional local server on :4173
npm run deploy       # build + test + commit index.html + push (Pages auto-deploys)
```

GitHub Pages serves from main branch root. Deploy quirk learned the hard way:
if the Pages workflow sits Queued >10 min, don't re-run the same run — cancel
it and push a trivial commit to spawn a fresh run.

Note `npm run deploy` only commits `index.html`; source and doc changes have to
be committed yourself first.

### Running it locally

Opening `index.html` straight off disk works — `file://` was **measured**
supporting localStorage *and* IndexedDB (Blobs included), so nothing the app
needs is missing there. `npm run serve` exists only to give a scheme matching
production, which matters if you're chasing an origin-dependent bug.

**Every origin has its own storage.** `file://`, `http://localhost:4173` and
`https://shivinate7.github.io` are three separate ledgers that cannot see each
other, so data "vanishing" when you switch is expected, not a bug. Moving
between them means Backup → restore, and photos need *Backup + photos*.

## Testing approach

`npm test` — 105 assertions, no test framework, ~6s. `test/app.test.mjs` runs
top to bottom and either prints "all green" or exits 1; `test/harness.mjs` holds
the jsdom setup, storage mocks, DOM helpers and the fixture.

It bundles `app.jsx` with esbuild (platform=node, format=cjs), boots it in jsdom
against mocked `window.storage` / `window.photos`, and drives it with real DOM
events, asserting on rendered text. The app has no exports but the component and
that's fine — every behaviour worth protecting is one you can see, so the
assertions read the DOM the way the user does.

(Three previous harnesses were written ad hoc and thrown away, which is why the
same assertions kept being rewritten from scratch. Hence this one is committed
and `jsdom` is a real devDependency.)

**The suite is mutation-tested.** Breaking a behaviour on purpose must turn it
red — verified for: assignment checking in more than was recorded, `resetAll`
forgetting to clear envelopes, and undo restoring a snapshot instead of
subtracting its own delta. Do the same when you add a claim; an assertion that
can't fail is decoration.

That exercise already earned its keep once. Every assignment in groups 1–19
happens to take a card's *full* quantity, so the mutation "assign marks the
whole line received" passed all 101 of them. Group 20 exists to catch it:
record **one** copy of a qty-2 line and check exactly one copy lands. Don't
delete it.

Gotchas worth remembering:

- `navigator` can't be assigned onto Node's `global` — use `Object.defineProperty`.
- jsdom holds the process open unless you `window.close()` at the end.
- Write the esbuild output *under the project* (e.g.
  `node_modules/.mailday-harness/`) or its own `require("react")` resolves to a
  second React copy and hooks blow up.
- `boot()` must unmount the previous root before calling `createRoot` on the
  same container again.
- **jsdom has no IndexedDB.** Mock `window.photos` directly rather than trying
  to polyfill — the app only ever sees that API, and a `Map` of Blobs matches
  its contract exactly.
- Drive file restore through the drop handler: build an `Event("drop")` and
  `Object.defineProperty` a `dataTransfer` onto it. Setting `input.files` isn't
  practical.
- The photo sweep is on a 2s timer and the ledger save is debounced 500ms;
  tests must wait past them (`SWEEP_WAIT`, `SAVE_WAIT`).
- Packages render expanded, so "Mark all received" matches several buttons —
  reach into the specific card, not the first hit on the page.

Test groups map to the claims this file makes, so if you change a behaviour
deliberately, change the assertion and the prose in the same commit. What's
covered: mystery mail hiding controls that don't apply; recording moving no
counts; candidates ranking without deciding; assignment checking in *only* what
was recorded (including partial quantities); undo composing with a later hand
edit; ties from near-duplicate packages; leftovers keeping id/createdAt/note;
smart-punctuation name matching; migration from pre-feature saves; `resetAll`
surviving the debounce; candidates self-correcting when a package is received
elsewhere; both backups and both restore paths; the photo sweep; and the older
package/by-item views still working.

Still only covered by eye, never by a test: anything that needs a real device —
the camera capture, the canvas downscale, iOS keyboard behaviour, and layout at
375px.

Worth moving to vitest + testing-library if this grows much further; the
hand-rolled `ok`/`eq` and the top-to-bottom script are fine at this size but
give no isolation between groups.

## Known open threads

- Vendor toggle (include eBay purchases) — user undecided, currently hard-filtered to TCG.
- Custom home-screen icon (apple-touch-icon needs a real PNG file in the repo).
- Possible migration to Netlify/Cloudflare for faster deploys. An origin change
  resets phone storage — both localStorage *and* IndexedDB — so it needs a
  Backup + photos → restore round trip. User is aware and relaxed about it.
- **Unverified on-device:** iOS clears script-writable storage after 7 days of
  non-use under ITP, but home-screen-installed web apps are understood to be
  exempt. Worth confirming empirically, since it's the difference between
  "safe" and "data quietly vanishes".
