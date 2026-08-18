# Mail Day Ledger

*(The app presents itself as **MANIFEST**, under a C.H Postal Company
letterhead. "Mail Day Ledger" remains the project's name — repo `mailaudit`,
storage namespace `mailday:` — and neither of those may be renamed to follow the
masthead; see invariant 1. The browser `<title>` in `build.mjs` is "Manifest";
`apple-mobile-web-app-title` is deliberately still "Mail Day", because iOS bakes
that label in at install time and changing it forces a delete-and-re-add of the
home-screen icon. That mismatch is intentional — don't "fix" it without asking.)*

A single-page tool for verifying receipt of TCGplayer card orders. The user buys
hundreds of low-cost cards across many sellers; this app ingests OrderWand CSV
exports of their order history and gives them a checklist to mark cards as
received, see what's outstanding (and its dollar value), and flag possibly-lost
mail. Three views over the same check-in data: **Packages** (order + seller,
the mail-day working view), **Tally** (the same product name pooled across
every seller, for "did all four of these arrive?" and for cost basis), and
**Orphaned** (packages that arrive with no way to tell who sent them).

## Architecture

- `src/app.jsx` — the entire application, one React component file. No router,
  no CSS files (inline styles + one `<style>` tag for focus rules), Tailwind is
  NOT used. Dependencies: react, react-dom, papaparse only.
- `src/entry.jsx` — the platform layer. Provides `window.storage` (async
  get/set/delete/list over localStorage, holding the ledger),
  `window.photos` (async put/get/delete/keys/clear/sweep/usage over IndexedDB,
  holding envelope photos) and `window.remote` (target/status/setKey/clearKey/
  pull/push/pushForce over the GitHub Contents API), then mounts the app.
- `src/b64.mjs` — UTF-8-safe base64, for the Contents API. Its own module
  because it is the one piece here that fails by producing *plausible corrupted
  data* rather than an error, and `entry.jsx` can't be loaded from a test.
- `src/remote-rules.mjs` — the two adapter decisions worth asserting on:
  `classifyStatus` (GitHub's overloaded status codes → an error code the UI can
  phrase) and `pushBody` (which omits the sha only on a create). Same reasoning
  as `b64.mjs`: both fail quietly, so both are pure and directly tested.
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

**`window.remote` is transport, not storage.** localStorage remains the source
of truth; the GitHub copy is a manual, tap-triggered backup and the app is
fully functional offline. Nothing in it runs on a timer. Continuous sync was
considered and rejected: the ledger blob is ~350KB at 1000 items and is
rewritten *whole* on the 500ms debounce, GitHub's secondary limit is 80
content-generating requests/min and 500/hr, and a commit per check-in would
grow the repo that serves the app forever.

The access token lives at raw localStorage key **`mailday-remote:v1`**,
deliberately *outside* the `mailday:` namespace. `window.storage.list()`
enumerates that prefix; nothing calls it today, but the day someone adds "back
up everything in the namespace" the token would be swept into a file the user
emails to themselves. Keeping it out makes that impossible by construction
rather than by remembering. Verified in a browser: after saving a key,
`storage.list()` still returns only `["mailday:v1"]`.

## Invariants — do not break these

1. **Storage keys are frozen.** App-level key `mailday:v1` (see STORAGE_KEY),
   shimmed under localStorage namespace `mailday:` → literal key
   `mailday:mailday:v1`. Real users have months of check-in data under these
   keys. Any schema change must ship with in-place migration in the load path.
2. **Saved-state shape:** `{ items, received, envelopes, dateFilter, sortBy,
   itemSort, savedAt }`. `items` = array of parsed line items; `received` = map
   of item key → count received; `envelopes` = orphaned-mail records, each
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
   The count stays **five**, not six, because the download and the GitHub push
   share one payload builder — `snapshot()`. Give the push its own and the next
   person to add a key misses one. The push carries no timestamp for the same
   reason: it goes in the commit message instead, so the pushed bytes stay
   identical to what the Backup file has always contained.
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
   auto-collapse mid-interaction. In the Tally view the sticky rule is
   stricter — a *completed item* also stays until filters change, because most
   items have a single copy and vanishing on every tap would recreate exactly
   the mis-tap cascade this invariant exists to prevent.
6. **No native browser dialogs.** `window.confirm`/`alert` block the whole page
   and look wrong in a home-screen app; every destructive action uses an inline
   two-tap confirm instead (Reset, Discard, Assign, **Pull**, **Push anyway**).
   Keep that pattern. (This started as a sandbox limitation and outlived it —
   it's now a UI choice.) With three armable controls in the main component,
   arming one **disarms the others** via the shared `arm`/`disarm` pair: two
   primed destructive buttons side by side is the exact mis-tap the pattern
   exists to prevent. Test 26.17–26.19.
7. **Orphaned mail never decides anything.** The user buys the same cheap cards
   from many sellers, so *near-duplicate packages are normal* — two outstanding
   orders can have identical contents. The app may rank the packages an envelope
   could have come from; it must never auto-assign, never treat a perfect
   fingerprint match as an action, and never check off a card the user didn't
   record (no "mark the rest of the package too"). Equally-good candidates are
   reported as a tie and rendered without emphasis. This constraint came
   directly from the user — don't "simplify" it away as friction.
8. **The GitHub token is a credential, not ledger data.** It must never enter
   the ledger blob, a backup file, the pushed payload, the repo, the bundle, or
   React state. Three structural guarantees, in descending strength: it lives
   outside the `mailday:` namespace so no enumeration finds it; the key input is
   **uncontrolled** (a `ref`, read once on submit, then cleared) so it is never
   in a state snapshot or a DevTools dump; and the payload is built from named
   fields and never spreads state. `resetAll` deliberately does **not** clear it
   — it is a device credential, and dropping the stored sha with it would 422
   the very next push for no reason. Test 25.24–25.27.

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

## Feature map (all implemented)

Everything here is user-verified in daily use except the **Tally** view, cost
basis, **Orphaned**, **envelope photos** and **Push / Pull**, which are newer
and so far verified only by `npm test`. The camera path in particular has never
run on a real iPhone, and no request has ever gone to the real GitHub API — the
push/pull paths are covered by the harness mock and by hand against the built
page. See "Known open threads" for exactly what that leaves unproven.

- Three views behind an Orphaned / Tally / Packages switch at the top. The
  first two share one `received` map, the date filter, search, and Hide
  received; Orphaned hides all of those (they apply to nothing there) but
  keeps Re-import / Backup / Reset reachable. The switch survives an empty
  ledger so pending envelopes can't be stranded, and carries a count badge when
  envelopes are waiting.
- **Tally view**: line items pooled by *exact* Product Name across every
  seller and order (TCGplayer names are a scrape, so duplicates are
  byte-identical — no normalization is done, deliberately). Each row shows
  `got/ordered`, the **unit rate** ("$X / copy"), "N left · $Y",
  seller/order counts and the sets
  involved; expanding adds a "$X across N copies · $Y avg" line and lists every
  source copy (seller, date, set, order id) with the same tap-to-check and qty
  stepper as the package view, plus per-copy lost-mail flags. Counts and basis
  always cover every copy of the item even when Hide received or search filters
  the breakdown — a "N copies hidden by filters" note says so. Sort: most
  missing / biggest position / most ordered / $ remaining / **unit rate** /
  name A–Z, frozen while checking and persisted as `itemSort`. Unit rate is
  `basis / qty` — the same figure the expanded row shows as "$Y avg" — and it
  deliberately disagrees with "biggest position": a cheap card bought in bulk
  has a large position and a small rate.
- **Cost basis** = Σ (Price × Quantity) over the item's non-canceled copies in
  the active date range. Shipping and tax are per-order columns in the CSV, not
  per-line, so they are deliberately not allocated into it. Basis is what was
  paid and never moves when copies are checked in; the red figure beside it is
  what's still outstanding.
  The collapsed Tally row shows the **unit rate** (`avg` = basis / copies), not
  the basis — what one copy averaged is the more useful number at a glance when
  most rows are a single cheap card. The whole position is one tap away:
  expanding shows "$X across N copies · $Y avg". Note the "biggest position"
  sort still ranks by total basis, which is deliberately a different ordering
  from "unit rate" — a cheap card bought in bulk has a large position and a
  small rate.
- **Orphaned**: for packages that arrive with no way to tell who sent them.
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
  Candidates ignore the date filter on purpose (an orphaned envelope is as likely
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
  hidden entirely under Orphaned. Package sort (newest/oldest/$ remaining/
  unit rate/seller A–Z) is separate from `itemSort`; the control swaps with the
  view. Both orders are frozen while checking.
  **Unit rate** means different things per view and both are implemented:
  in Tally it is `g.avg` (the group's basis over its copies); for a package it
  is that package's basis over its own copies, computed in `packageOrder`.
  The **date range is collapsed behind one control** showing the active range;
  tapping it reveals the chip set, the free "# days" box and the custom from–to
  pair. It defaults shut on every load and is not persisted — a disclosure, not
  a preference. Collapsing it was worth ~22px: seven chips wrapped to two rows
  at 375px, and custom from–to always claimed a third because native
  `<input type="date">` carries a ~140px UA minimum width.
- Outstanding value: overall "$X still missing", per-package and per-item
  "N left · $Y".
- Lost-mail flags on untracked unreceived packages: amber "may be lost" at 14d
  from order date, red "refund window closing" at 30d (TCGplayer refund
  eligibility ends 30 days after estimated delivery; order date is a
  conservative proxy since EDD isn't in the CSV).
- Canceled orders: excluded from list and all counts; viewable via
  "N canceled — view" link which scrolls to a dashed reference section (for
  refund auditing). Tracked/untracked shown as ●/○ dot + word in header meta.
- **Two local backups and one remote.** *Backup* downloads
  `{mailday:1, items, received, envelopes, dateFilter, sortBy, itemSort}` —
  small, quick, and holds the irreplaceable part. *Backup + photos* (only shown
  when photos exist) adds `photos` as an `{id: dataURL}` map; photos are memory
  aids, so paying their file size is opt-in. The file picker restores either
  (any `.json` routes to restore, `.csv` routes to import) and tolerates older
  backups missing newer keys. A restore is a full replace, so if pending
  envelopes are about to be replaced the notice says so — they're hand-typed and
  losing them silently would be the worst kind of quiet.
  Both the file restore and the GitHub pull funnel through one `applyBackup()`.
  That matters twice: the `!data.mailday || !Array.isArray(data.items)` check is
  the *only* thing between a corrupt payload and a wiped ledger, so it should
  exist once; and the replaced-envelopes warning then covers the pull too, where
  it matters more, because a pull is one tap rather than a deliberate file drop.
- **Photo ids on restore: keep an id when its blob is inlined in the payload OR
  already present on this device; strip only the rest.** This used to be
  all-or-nothing on `data.photos`, which is right for a file restore onto a
  fresh origin and silent data loss everywhere else. A pushed payload never
  carries photos (they stay local by design), so pulling onto the very device
  that took them stripped every id — and the sweep effect then deleted the JPEGs
  from IndexedDB two seconds later, with nothing to restore from. The same bug
  was already latent on the file path (plain Backup → restore on the same
  device); it was simply rarely exercised. Tests 19.11–19.12, 26.11–26.13.
- **Push / Pull (GitHub).** Manual, tap-triggered backup to `ledger.json` on the
  **`data` branch** of `shivinate7/mailaudit` — never `main`, because Pages
  deploys from main's root and every backup would otherwise trigger a site
  rebuild. Push needs a fine-grained PAT (`Contents: read & write`, that repo
  only) pasted once per device; **pull needs no key at all** on a public repo,
  which is what lets a fresh device recover before it has been set up.
  Conflict detection is the Contents API's blob sha, and the sha sent is the one
  *this device last saw* — never one re-fetched moments earlier, which would
  make every push win and silently discard the other device's. A stale push
  reports the conflict and changes nothing; `Push anyway` (two-tap) is the
  escape hatch, and it is safe-ish because every push is a commit, so what it
  overwrote is still in the branch's history. A bad *pull* has no such
  recovery — which is why Pull gets the two-tap and Push doesn't.
  Photos never go to git.
- Persistence auto-saves debounced 500ms with saved/saving indicator. The remote
  is deliberately *not* on that path — no error there ever touches `saving`.

### The ruled head

The control region is the masthead's own vocabulary continued, not a tray of
buttons in a different idiom: hairline rules, uppercase mono micro-labels over
Cochin values, no boxes and no fills except the accent that means "active"
everywhere else in the app. It replaced a region that shared a control height
and nothing else — two radii (999px chips beside 8px rects), two font families,
three type sizes, a native `<select>` drawing its own caret and a native date
pair rendering grey `mm/dd/yyyy` in the system font on a parchment page.

Three ruled cells report the state and open what changes it:

- **Orders from** — the active range, plus the only figure line in the row
  (`N lines · M outside`). The other two cells deliberately carry no figure;
  they would be restating the masthead's own tallies a hundred pixels above.
- **Showing** — the old "Hide received" button, said as state (`○ Everything` /
  `● Unreceived`) rather than as an instruction.
- **Sorted by** — opens a panel of options. There is no `<select>` in the app
  any more.

Then a **Find** row carrying search, with the canceled reference beside it as
another ruled cell rather than an underlined link floating on its own line.
Then the file actions, **set apart** — flattening them into the same ruled grid
destroys the separation the region has always kept: file management is not a
filter.

Two details that are load-bearing and easy to undo by accident:

- **The two cells that open something underline their value.** A cell built out
  of the same parts as the masthead's *read-only* tallies reads as a statistic —
  the first draft scored 2/5 on discoverability with a reviewer for exactly this.
  The underline is a form's write-on rule, not a button box, so the thesis
  survives.
- **`grid-template-columns: repeat(3, minmax(0, 1fr))`, never `1fr`.** A bare
  `1fr` is `minmax(auto, 1fr)`, so a long value expands its track past its third
  and squeezes the other two. And `text-overflow: ellipsis` does nothing on a
  flex container — it has to sit on the text child, which also needs
  `min-width: 0` or it refuses to shrink. Measured before this was fixed: a
  25-character sort label took its cell from 114px to 182px and pushed the
  document to **377px in a 375px viewport**. jsdom has no layout, so **no
  assertion can catch a regression here** — re-measure at 375px if you touch it.

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

**Everything that moves data in or out still sits behind the `Sync`
disclosure** — Push, Pull, Backup, Backup + photos, the target line and the key
field. It uses the same `panelWrap` surface as the date and sort disclosures.
It did not at first, and it was the one panel in the region with no padding and
no rule, so its buttons sat flush against the section edge while the chip that
opened them was right-aligned above — which reads, correctly, as off-centre.
Everything inside it is one left-aligned block flush with `FIND`; the target
line lost its `marginLeft: auto` for the same reason. Re-import and Reset stay on the narrower `items.length > 0 ||
envelopes.length > 0` gate; Sync survives it, because an empty ledger is exactly
when Pull is needed. Group 28.

Every control shares one height — `CTL_H`, currently 34px — via `ctl`,
`ctlSelect` and `chip()` beside `dateInput`/`miniBtn`. Before those existed,
chips were `5px 11px`, selects `9px 8px` and buttons `9px 12px`, so nothing
shared a baseline and the rows wrapped raggedly; **that mismatch, not the
colours, is what read as unfinished.** Change `CTL_H` and the whole toolbar
follows. Note `ctl` sets `boxSizing: border-box` because inputs are content-box
by default while buttons are not — without it the search field renders 2px
taller than everything beside it.

`flexShrink: 0` is on all of them deliberately: the region had none, so a long
label ("Tap again to clear everything") could push a line past the column edge.

**The file actions are gated on `items.length > 0 || envelopes.length > 0`, the
same condition as the view switch — not on `items.length` alone.** They used to
be, which meant a user holding hand-typed orphaned envelopes with an empty item
list had no Backup button at all, for data that exists nowhere else. Test 23.1.
The filters keep the narrower `items.length > 0` gate, since they describe a
list that isn't there.

**And the whole region is gated on `… || !!window.remote`, wider still.** Same
bug, one level out, found on the live site the day Push/Pull shipped: an empty
ledger is *exactly* when Pull is needed — a new phone, ITP having cleared
storage, a move to another origin — and gated on data alone, the one control
that recovers from having no data was unreachable whenever you had no data. The
only button on screen was "Choose file". Now an empty ledger shows `Sync` alone:
**Re-import and Reset stay on the narrower gate**, because there is nothing to
re-import into (the upload zone is already up unprompted) and nothing to clear,
and a red destructive button on an empty ledger is noise at best. Group 28.

The pattern to take from this: any control that *recovers* state must not be
gated on that state existing. Backup was widened once for this reason, Sync
twice.

Measured at 375px against 281 real lines across 150 orders, from the view
switch to the first package card: **185px at rest**, 282px with the range panel
open, 326px showing "last N days", 467px showing the month picker. Horizontal
overflow is 0 in every state and no option string clips.

Note the resting figure is **14px worse than the 171px it replaced**, and that
is the trade, made knowingly: what was bought is that both native controls are
gone, the state reads at a glance instead of having to be inferred from four
separate controls, and nothing in the region wraps or reflows when the view
changes. If the height ever has to come back, the `.fig` line and the cell
padding are where it is.

## Design language

"Parchment ledger" (palette D▸, Violet Evergarden–inspired): warm parchment
page, violet ink and accent, gold secondary. Every colour lives in the `C`
object at the top of `src/app.jsx` — **there is no colour literal anywhere else
in the file, and no pure white in the theme.** Never reach for `"#fff"`; use
`C.card`, which is the off-white parchment surface.

Cochin (the `cochin` constant) for everything that isn't a number, monospace for
numbers/ids/labels. There is no sans in the app any more — the old `sans`
constant is gone and the root sets `serif`, which everything inherits.

**Form controls do not inherit `font-family`.** Browsers force their own UI
font onto `button`/`input`/`select`/`textarea`, so setting the family on the
root is not enough — a `button, input, select, textarea { font-family: inherit }`
rule in the `<style>` tag is what actually makes them Cochin. Without it every
button that doesn't set a family inline silently renders in the UA default
(Arial in Chrome); it looked like seller names "weren't Cochin". **jsdom has no
UA stylesheet doing this, so no test can catch a regression here** — it was
caught by reading `getComputedStyle` in a real browser, and that's the only way
it will be caught again.

The outstanding "N left · $Y" pill is the one deliberate exception to
"mono for numbers": it's set in `serif` so it reads in the letterhead voice
rather than as tabular data. No emoji in
chrome except the empty-state 📬. Typographic dot indicators, not icons. Max
content width 760px; must work at 380px (iPhone). Touch targets: whole-row tap,
30px check indicator, 34px steppers. The view switch is a pill-shaped segmented
control in uppercase mono, active segment filled with **accent violet** — same
treatment as the active date-range chip. It is **equal thirds at full width**
(`grid-template-columns: repeat(3,1fr)`), in the order Orphaned / Tally /
Packages — Packages sits right so the daily-driver view lands under the thumb.

Equal thirds *inverted* the old sizing constraint, so ignore any advice about
trimming the pill padding. The pill can no longer overflow the column; it is the
column by construction. The constraint moved inside: the longest label plus its
count badge has to fit **one third — 114px at 375px** — and the lever is the
clamped `font-size`, not the padding. Measured at 375: all three fit.

Semantics, which survived the repaint unchanged: green means received, red means
missing money or destructive, manila/gold means advisory, amber means the 14-day
lost-mail warning, and accent violet means "active control". The progress bar is
accent while in progress and green at 100% — it used to be `ink`, which worked
only because the old ink was a near-black *green*; the new ink is a near-black
violet and read as flat black on parchment.

Orphaned follows the same language: manila for anything advisory (the
ambiguity warning, the "as typed" row, the "no outstanding copy" tag), green
only on an exact match and the armed check-in confirm, red only on Discard.
Photo thumbnails are 56px squares; the viewer is a full-screen ink scrim, tap
anywhere to dismiss.

### The masthead

The top of the page is one composed letterhead, not stacked boxes: a wax seal
between two gold rules, **MANIFEST** in Cochin caps, the C.H Postal Company
line, then the tallies folded in under a hairline. The stats used to be their
own bordered card and the two edges fought each other 20px apart.

The tallies are three ruled thirds — cards, packages, value — each `done/total`.
Value is compacted (`compact()`: whole dollars under 1k, then `k`/`M` at ≤2dp,
zeros trimmed) because three figures share one row at 375px. **`money()` is
still the format anywhere a figure has to be read exactly**, including the
"still missing" line directly beneath, which is deliberately not rounded.

Sizing is by `clamp()`, never breakpoints — this file still has **zero media
queries** apart from `prefers-reduced-motion`. Each curve is tuned to hit its
design size at 375px and again at 760px, where the content column stops growing.
The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`: measured 36px at 375.

**The running head is load-bearing for invariant 5.** The tall block is ordinary
content that scrolls away; the slim bar after it is `position: sticky` with a
*fixed* height, so it is always in flow and pinning changes paint, never layout.
An `IntersectionObserver` on a 1px sentinel toggles only `opacity`/`transform`.
Do not "improve" this into a height animation, and do not swap the observer for
a scroll listener. Two traps, both already paid for:

- The effect must depend on `loaded`. The first commit renders the loading
  shell, so an effect with `[]` deps binds to a sentinel that doesn't exist and
  the bar stays invisible forever, with nothing looking broken. Test 21.7/21.8.
- The `top < 0` guard is not redundant. A sentinel is also un-intersecting when
  it is *below* the fold, which is the state at the top of a short viewport;
  without the guard the bar pins while you are looking at the header. Test 21.10.

Measured at 375px: horizontal overflow 0, switch thirds 114/114/114, all labels
fit, row displacement on pin **0.00px**.

### The palette, and why each value is what it is

| token | hex | role | contrast |
|---|---|---|---|
| `paper` | `#F2E9DA` | the page | — |
| `card` | `#FCF6EA` | any raised surface; **the theme's "white"** | — |
| `ink` | `#332E3F` | primary text | 10.88:1 on paper |
| `inkSoft` | `#6E6379` | secondary text | 5.24:1 on card |
| `line` | `#DCCDB6` | rules, borders | — |
| `accent` | `#6F5CA6` | active controls, progress | 5.19:1 on card |
| `green` | `#2E7A5E` | received | — |
| `greenSoft` | `#E6E7D7` | checked-row wash (gold-warmed) | ink on it 10.46:1 |
| `red` | `#A8443C` | missing money, destructive | — |
| `redSoft` | `#F4E4D9` | danger wash | red on it 4.76:1 |
| `manila` | `#EADBBA` | advisory background | — |
| `manilaInk` | `#695832` | text **on manila** | 5.04:1 on manila |
| `amber` | `#846008` | 14-day lost-mail warning | 5.33:1 on card |
| `gold` | `#C9A961` | ornamental rules only — **never text** | 2.2:1 on card |
| `silver` | `#C4C3C0` | the empty half of a progress bar | fill on it 3.17:1 |
| `wax*` | five values | the seal's relief ramp, `<Seal>` only | — |

Everything carrying information clears 4.5:1. Two values are load-bearing in a
non-obvious way and should not be nudged casually:

- **`inkSoft`** was darkened from the originally-chosen `#7A6E86`, which measured
  4.43:1 and failed. It is used 42 times, more than any token but `ink`.
- **`manilaInk`** is checked against **`manila`**, not against `card` — it sits on
  the advisory background. Pick it on the wrong pair and it looks fine in
  isolation while failing everywhere it's actually used.
- **`silver`** was chosen on looks, not legibility: the `line` it replaced
  measured *better* against the violet fill (3.58:1 vs 3.17:1). Both clear the
  3:1 floor for graphical objects, so it's a fair trade — but if it's ever
  revisited, it has to stay **cool**. Every warm metal tested (pewter, deep
  parchment) fell below 3:1 against violet.
- **`gold`** is ornament only. At 2.2:1 on `card` it fails for text by a wide
  margin; it exists for the masthead rules and nothing else.

`theme-color` in `build.mjs` and the `<style>` page background both track
`paper` (`#F2E9DA`). If `paper` changes, change them in the same commit or
Safari's chrome sits as a mismatched band above the page.

The icon was designed against this palette first and the UI followed; see
`icon/gen-icon.py` for that side of it.

At iPhone width the Tally row is genuinely tight: the right-hand column holds
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

### The GitHub backup (one-time setup)

Target is `shivinate7/mailaudit`, branch **`data`**, file `ledger.json` — three
constants at the top of the `window.remote` block in `entry.jsx`, so pointing at
a private `mailaudit-data` repo later is a constant swap and nothing else.

**Before pushing anything real**, open
`raw.githubusercontent.com/shivinate7/mailaudit/data/ledger.json` in a
logged-out window. The repo is public, so that is what the world can see: order
ids, sellers, prices, dates, and any tracking numbers typed into envelope notes.
Git also makes it permanent. If that is not acceptable, switch to a private repo
*first* — much harder to undo afterwards. (Pull then needs the key on every
device, since GitHub hides a private repo's existence behind a 404.)

1. Create the branch, orphaned so it carries no source and never looks
   deployable:
   ```bash
   git switch --orphan data && git commit --allow-empty -m "data branch: ledger backups live here, never merge to main" && git push -u origin data && git switch main
   ```
2. Settings → Pages should read "Deploy from a branch: `main` / `(root)`". Pages
   only builds on pushes to its configured branch, and this repo has **no
   `.github/workflows`**, so a push to `data` triggers nothing. Never merge
   `data` into `main`.
3. Settings → Developer settings → Personal access tokens → **Fine-grained**.
   Name it per device (`mailday-iphone`) so one can be revoked alone. Only
   select repositories: `mailaudit`. Repository permissions: **Contents → Read
   and write** (Metadata → Read-only appears automatically and is required).
   Nothing else. **Fine-grained PATs cap at 366 days** — set a real expiry and a
   calendar reminder, because when it lapses the only symptom is a push that
   stops working.
4. In the app: Sync → paste → Save key → Push. Expect `Pushed ✓`, and check
   `main` gained no commit.

### Icons

`apple-touch-icon.png` (180×180), `favicon.svg` and `icon-32.png` are committed
assets at the repo root, referenced by `<link>` tags in the `build.mjs` head
template. The 1024 master and the generator live in `icon/` — `python3
icon/gen-icon.py` rewrites both the master SVG and `favicon.svg`, and that
file's docstring has the exact Chrome + `sips` commands to re-export the PNGs.
The generator is stdlib-only and never runs during build or test.

**The favicon is a different drawing, not the master shrunk.** A tab renders it
at 16 CSS px; the master is a *scene* — a brooch on a violet ground — so at that
size the ground ate the frame and the mark landed around 10px, reading small and
washed out beside other tabs' icons. `favicon_svg()` drops the ground entirely
(transparent, which favicons allow and `apple-touch-icon` does not), scales the
mark until the lobes touch the edge, and cuts everything that only exists to be
seen large: the guilloche, the 32 scroll marks, the engine-turned field. What is
left is what still reads at 16px — gold ring, eight lobes, emerald centre.
The SVG is served first with the PNG as a fallback for browsers that don't take
`type="image/svg+xml"`.

Two things that will bite:

- **Both `href`s must stay relative.** Pages serves this from the `/mailaudit/`
  subpath, so a root-absolute `/apple-touch-icon.png` resolves to
  `shivinate7.github.io/apple-touch-icon.png` and 404s.
- **Exporting the favicon PNG needs an ABSOLUTE `file://` src** in the throwaway
  HTML, and `--default-background-color=00000000` to keep the alpha. A relative
  src resolves against `/tmp`, renders nothing, and produces a blank PNG that
  looks like a successful export — it happened once.
- **iOS caches home-screen icons hard.** Changing the PNG does nothing to an
  already-installed home-screen app; it has to be deleted and re-added from
  Safari. That is safe for data — check-ins are keyed to the *origin*, not the
  icon — but take a Backup first out of habit.

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

`npm test` — 219 assertions, no test framework, ~20s. `test/app.test.mjs` runs
top to bottom and either prints "all green" or exits 1; `test/harness.mjs` holds
the jsdom setup, storage mocks, DOM helpers and the fixture.

It bundles `app.jsx` with esbuild (platform=node, format=cjs), boots it in jsdom
against mocked `window.storage` / `window.photos` / `window.remote`, and drives
it with real DOM events, asserting on rendered text. The app has no exports but
the component and that's fine — every behaviour worth protecting is one you can
see, so the assertions read the DOM the way the user does.

(Three previous harnesses were written ad hoc and thrown away, which is why the
same assertions kept being rewritten from scratch. Hence this one is committed
and `jsdom` is a real devDependency.)

**The suite is mutation-tested.** Breaking a behaviour on purpose must turn it
red — verified for: assignment checking in more than was recorded, `resetAll`
forgetting to clear envelopes, and undo restoring a snapshot instead of
subtracting its own delta. Do the same when you add a claim; an assertion that
can't fail is decoration.

The GitHub backup added ten more, all confirmed to turn the suite red:
`snapshot()` dropping `envelopes`; `utf8ToBase64` replaced by `btoa`;
`applyBackup` skipping the `mailday` validation; the pull reusing the old
all-or-nothing photo predicate; Pull firing on one tap; a push treating every
failure as success; arming Pull no longer disarming Reset; a pull that doesn't
refresh the sha; `pushBody` always sending a sha; and a 403 always reading as a
permission problem.

That exercise caught a real one *here too*: the first draft of "pulling
refreshes the sha" asserted on the payload, and a pull makes this device's
ledger identical to the remote's — so the assertion was true whether the push
landed or not, and the mutant survived. It now asserts on the **sha advancing**,
which is the only thing that distinguishes the two states. Watch for this shape
generally: after a pull, payload-equality assertions prove nothing.

That exercise already earned its keep once. Every assignment in groups 1–19
happens to take a card's *full* quantity, so the mutation "assign marks the
whole line received" passed all 101 of them. Group 20 exists to catch it:
record **one** copy of a qty-2 line and check exactly one copy lands. Don't
delete it.

New in group 21 (the masthead): `test/harness.mjs` stubs
`IntersectionObserver` and exports `observers`, so a test can hand the callback
an entry and assert the running head reacts. jsdom has no layout and no real
scrolling, so this verifies the *wiring* — that the observer attaches after the
loading shell, and that the stuck/unstuck condition is right — which is exactly
the part that can silently never fire. Whether a real scroller produces those
entries is the browser's job.

New in groups 25–27 (the GitHub backup). `test/harness.mjs` mocks
`window.remote` the same way it mocks `window.photos`, with two deliberate
choices:

- The mock encodes and decodes through the **real** `src/b64.mjs`, so an
  app-level push→pull round trip exercises the actual codec. That's why the
  non-ASCII test is meaningful: every item in `ITEMS` is pure ASCII, and a
  `btoa` regression would otherwise pass. The test drives it through an
  *envelope entry* rather than the fixture — that's where iOS smart punctuation
  actually enters, and it perturbs no counts.
- The mock enforces the sha check **for real** rather than faking a conflict:
  `remote.sha` is what the remote holds, `remote.deviceSha` is what this device
  last saw, and a stale push is rejected exactly as GitHub would. Seeding a
  remote without pulling *is* the second-device case.

Group 27 is different in kind: it imports `src/remote-rules.mjs` directly and
asserts on pure functions. That exists because `entry.jsx` mounts React on
import and is unreachable from the harness — the same gap the localStorage and
IndexedDB adapters have. Fetch plumbing is fine to leave uncovered; the status
mapping and the sha-omission rule are not, because both fail *quietly*. **Still
uncovered: the HTTP round trip itself.**

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
  practical. The same helper carries a CSV (`csv()` builds an OrderWand-shaped
  one) — papaparse reads it as a real Blob through jsdom's `FileReader`, so the
  file's MIME type has to track its extension even though the app routes on the
  name.
- The photo sweep is on a 2s timer and the ledger save is debounced 500ms;
  tests must wait past them (`SWEEP_WAIT`, `SAVE_WAIT`).
- Packages render expanded, so "Mark all received" matches several buttons —
  reach into the specific card, not the first hit on the page.
- Backup, Push and Pull live behind the Sync disclosure, so a test has to
  `await openSync()` first. It's idempotent; just call it.
- The ruled head replaced a Hide-received button, a native `<select>` and a chip
  disclosure, so `harness.mjs` exports `cell(re)`, `toggleShowing()`,
  `openRange()` and `pickSort(label)`. There is no `<select>` left to drive with
  `choose()`; pick sort by its visible label.
- **Anything about width is unassertable here.** jsdom has no layout, so the
  `minmax(0,1fr)` / `min-width:0` truncation fix in the head cannot be
  protected by a test — it was found by measuring a real 375px viewport and
  that is the only way it will be found again.
- The key field is uncontrolled by design, so `el.value = "…"` is enough — don't
  route it through `type()`, which exists for React-tracked inputs.
- A successful push shows `Pushed ✓` for 2.5s, so `btn(/^Push$/)` won't match
  during the flash. Assert on state, or wait it out.

Test groups map to the claims this file makes, so if you change a behaviour
deliberately, change the assertion and the prose in the same commit. What's
covered: orphaned mail hiding controls that don't apply; recording moving no
counts; candidates ranking without deciding; assignment checking in *only* what
was recorded (including partial quantities); undo composing with a later hand
edit; ties from near-duplicate packages; leftovers keeping id/createdAt/note;
smart-punctuation name matching; migration from pre-feature saves; `resetAll`
surviving the debounce; candidates self-correcting when a package is received
elsewhere; both backups and both restore paths; the photo sweep; the GitHub
push and pull (payload shape, non-ASCII round trip, conflict + force, expired
key, offline, the token never leaking, pull as a full replace, photo ids kept
vs stripped, arming one control disarming the other); entity decoding on
seller names, through a real CSV import; and the older package/Tally views
still working.

Still only covered by eye, never by a test: anything that needs a real device —
the camera capture, the canvas downscale, and iOS keyboard behaviour. Layout at
375px is no longer eyeball-only: it was measured in a real 375px viewport
(overflow 0, thirds 114px each, seal 36px, 0.00px row displacement when the
running head pins), though those numbers are not asserted in CI.

The GitHub adapter was also exercised by hand in a real browser against the
built `index.html`: `window.remote` present, a keyless push reporting `no-key`,
a bad-shaped key rejected before any request, a saved key landing in
`mailday-remote:v1` and **not** in the ledger blob, with `window.storage.list()`
still returning only `["mailday:v1"]`, and `resetAll` clearing the ledger while
leaving the token.

One real request *has* gone to the live API, from the deployed Pages origin: a
keyless `pull()` against the empty `data` branch returned 404 → `missing`. That
is worth more than it looks — it proves CORS works from `shivinate7.github.io`,
that the branch resolves (a missing *branch* answers "No commit found for the
ref", a missing *file* answers "Not Found"), and that `classifyStatus` maps the
real response. **Still never run against real GitHub: an authenticated push, a
pull that returns content, and a conflict.**

That same session is what surfaced the group-28 bug — Pull unreachable on an
empty ledger. Worth remembering as a method: the suite was all green and the
feature was still broken in its single most important scenario, because every
test booted a ledger that already had data in it.

Worth moving to vitest + testing-library if this grows much further; the
hand-rolled `ok`/`eq` and the top-to-bottom script are fine at this size but
give no isolation between groups.

## Known open threads

- Vendor toggle (include eBay purchases) — user undecided, currently hard-filtered to TCG.
- Possible migration to Netlify/Cloudflare for faster deploys. An origin change
  resets phone storage — both localStorage *and* IndexedDB — so it needs a
  Backup + photos → restore round trip. User is aware and relaxed about it.
- **Unverified on-device:** iOS clears script-writable storage after 7 days of
  non-use under ITP, but home-screen-installed web apps are understood to be
  exempt. Worth confirming empirically, since it's the difference between
  "safe" and "data quietly vanishes". (Push/Pull now makes this survivable
  either way, provided the user actually pushes.)
- **The pushed ledger is world-readable.** The repo is public, so `ledger.json`
  on the `data` branch is served at a permanent `raw.githubusercontent.com` URL
  to anyone, logged out — order ids, sellers, prices, dates, and any tracking
  numbers or sender names typed into envelope notes. The user opted into this
  knowingly; the escape hatch is a private `mailaudit-data` repo, which is three
  constants in `entry.jsx` plus "pull now needs a key on every device".
- **The token expires.** Fine-grained PATs cap at 366 days. When it lapses the
  app 401s and says "expired or been revoked" — but nothing warns beforehand,
  and the only symptom is a push that stops working.
- **The token sits on a shared origin.** `shivinate7.github.io` is one origin
  across every Pages repo, so script from any other project there can read
  `mailday-remote:v1`. Mitigated by the fine-grained, single-repo,
  Contents-only scope and one token per device — not eliminated.
- **No auto-pull and no merge, both deliberate.** The app never fetches on its
  own, and a conflict is resolved by the user (pull, or force), never by code
  trying to reconcile two `received` maps.
- **Never run against real GitHub.** Every push/pull path is covered by the
  harness mock and by hand against the built page, but no HTTP request has
  actually gone to the Contents API. Work through the setup checklist in
  "Build & deploy" the first time, and then verify the conflict guard for real:
  push from device A, then push from B *without* pulling, and confirm B is
  blocked and B's ledger is untouched. If B succeeds, the sha bookkeeping is
  wrong and A's data was just overwritten — recover with
  `git show data~1:ledger.json` and restore that file the normal way.
