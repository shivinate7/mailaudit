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
  no CSS files (inline styles + one `<style>` tag for focus rules, the
  masthead and the action row), Tailwind is NOT used. Dependencies: react, react-dom, papaparse only.
- `src/entry.jsx` — the platform layer. Provides `window.storage` (async
  get/set/delete/list over localStorage, holding the ledger),
  `window.photos` (async put/get/delete/keys/clear/sweep/usage over IndexedDB,
  holding envelope photos), `window.versions` (put/list/get/remove/prune/usage
  over its **own** IndexedDB database, holding gzipped ledger snapshots) and
  `window.remote` (target/status/setKey/clearKey/
  pull/push/pushForce over the GitHub Contents API), then mounts the app.
- `src/b64.mjs` — base64 for the Contents API: `bytesToBase64` is the shared
  core, `utf8ToBase64`/`base64ToUtf8` the ledger's text path, and
  `blobToBase64` the photo path. A JPEG is not UTF-8 — pushing one through the
  text encoder mangles every byte that isn't valid UTF-8 and changes its length
  (measured, and asserted in 31.21). Only an encoder is needed for photos: the
  pull asks for the raw media type and reads `arrayBuffer()`, so photo bytes
  never round-trip through base64 coming back. Its own module
  because it is the one piece here that fails by producing *plausible corrupted
  data* rather than an error, and `entry.jsx` can't be loaded from a test.
- `src/photo-rules.mjs` — the photo-sync rules, same rationale as the two below:
  naming (`photoName`/`photoIdFromName`/`mimeFromName` — the image type has to
  survive in the filename, because a raw GET answers with GitHub's media type,
  not the file's), `isAlreadyThere` (keyed on the raw **status**, not the
  classified code, since `classifyStatus` folds a sha-less 422 and a throttling
  409 into the same `conflict` and they mean opposite things), and `photoPlan`
  (the set difference, three-valued on the remote). Imported by `entry.jsx` for
  naming and by `app.jsx` for `photoPlan` — one of the **three** local-module
  imports in `app.jsx` (the others are `merge-rules.mjs` and
  `version-rules.mjs`), whose dependencies are otherwise react, react-dom and
  papaparse.
- `src/merge-rules.mjs` — reconciling two devices' ledgers: `mergeItems` (union
  by `it.key`, and the CSV import path calls it too so there is one definition
  of "union line items"), `mergeReceived` (per-key **max**), `mergeEnvelopes`
  (union by id, freshest `updatedAt` wins), `mergeStamps` (per-package,
  freshest `updatedAt` wins, tombstones included) and
  `mergeLedger`/`mergeSummary`.
  Pure and directly tested for the sharpest version of the reason the three
  modules below are: this is the piece that fails by producing a *plausible
  wrong ledger*, and a merge that silently drops 35 imported lines is
  indistinguishable from one that worked. **The merge only ever ADDS** — nothing
  is dropped, no count decreases — which is why it needs no two-tap confirm and
  why re-running it is harmless. The one exception is a *removed* stamp, which
  travels as a tombstone and beats an older stamp: still the user's own write
  winning by freshness, not the merge deciding anything, and there because a
  resurrected `refunded` stamp would silently pull money back out of the tally.
  `mergeLedger` builds the merged ledger from **named fields**, so a persisted
  key it does not name is dropped by every merge, applied locally as a full
  replace, and pushed — invariant 2's five sites in `app.jsx` are this file's
  sixth.
- `src/version-rules.mjs` — which saved versions survive a prune. Same
  rationale as the modules around it: a pruning bug deletes the one version the
  user was reaching for and leaves a list that looks perfectly healthy, so there
  is nothing to notice until the moment it can't be fixed. Four independent
  reasons to live, **unioned and never intersected** — the newest `recentKeep`,
  milestones inside `milestoneDays`, the earliest record of each *hour* inside
  `hourHours`, and the earliest of each *day* inside `dayDays`. The hourly tier
  closes the gap the others leave: the ring holds ten to thirty minutes of dense
  work before it churns out and the day anchor holds this morning, so without it
  the honest answer to "put it back to how it was at 11am" was "you can't".
  24 more records, ~600KB gzipped — the cheapest tier here.
  Two things are deliberate and easy to undo by accident: there is **no stored
  "hourly" or "daily" kind and nothing is ever promoted** — both anchors are
  derived at prune time by `earliestPer`, so they cannot drift out of step with
  the records the way a written-once flag would; and an anchor is its bucket's
  **earliest**, because the state worth reaching for is how things stood
  *before* the stretch that went wrong. `prunePlan` is the complement of `keptIds`
  so no record can be both. `shouldSnapshot` is the write gate. Imported by
  `entry.jsx` (`prunePlan`) and `app.jsx` (`shouldSnapshot`). Group 38.
- `src/remote-rules.mjs` — the two adapter decisions worth asserting on:
  `classifyStatus` (GitHub's overloaded status codes → an error code the UI can
  phrase) and `pushBody` (which omits the sha only on a create). Same reasoning
  as `b64.mjs`: both fail quietly, so both are pure and directly tested.
- `build.mjs` — bundles entry via esbuild and inlines the JS into a
  self-contained `index.html` with iOS home-screen-app meta tags. It also bakes
  in **the public seed** (see below): `git show origin/data:ledger.json`,
  reduced to `SEED_KEEP`, gzipped and base64'd into a `<script id="seed">`.
- `index.html` — the build output, committed to the repo. GitHub Pages serves it
  at https://shivinate7.github.io/mailaudit/ . The user runs it as an iOS
  home-screen web app.
- `test/harness.mjs` + `test/app.test.mjs` — the behaviour suite (`npm test`).
- `dev-server.mjs` — optional local static server (`npm run serve`).

### The public seed

The site is public and the ledger repo is not, and **those are different
artifacts** — Pages serves `main` root and has never served the `data` branch.
So sharing the URL used to hand someone the app with nothing in it: their
browser's localStorage is their own and empty, and the fetch for the ledger
404s. Measured, on the live site with storage cleared: the whole page was the
masthead and "Drop your OrderWand CSV here".

The seed closes that without reopening the repo. A snapshot is baked **into
`index.html`** at build time, so a visitor gets the app and the data in one
public file, hydrates into their own storage, and can do as they like with it.
They still cannot push — that needs a token they do not have, which was always
true and was never the gap.

**What is published is exactly `SEED_KEEP`** — `items`, `received`, `stamps`,
and the three view preferences. That is order ids, seller names, card names,
prices and dates: the substance of the ledger, and the point of sharing it.
What is withheld: **`envelopes` entirely** (hand-typed notes, where CLAUDE.md
has always said tracking numbers and sender names end up), and **stamp `note`
text** (the kind and date stay, so the status band still reads). Photos never
went near the ledger. Widen `SEED_KEEP` only on purpose — the Pages site is
world-readable and git is permanent.

The stamp-note leak was found by decoding the built page and grepping it, not
by reading the code. **Do that after any change here** — it is the only way to
know what you actually published. `npm run check:seed` is that grep written
down, and CI runs it on every push: it decodes the committed page's seed and
fails on any key outside `SEED_KEEP` or any surviving stamp `note`. Its
allow-list is `SEED_KEEP` itself rather than a copy, so widening the seed
widens the gate in the same edit — deliberately, since that edit is where the
thinking should happen. It is a backstop, not a proof: it can only refuse the
leaks someone already thought of, which is why the hand grep stays the
instruction.

Two guards in the load path, and the second is the one that matters:

- It never overwrites an existing ledger (`!value`).
- **It never runs on a device that has a key.** A keyed device is one of the
  owner's, and the seed is a build-time snapshot — hydrating it over cleared
  owner-storage would put stale data under a live sha, and auto-push would then
  publish it. A keyed device gets nothing here and recovers by pulling.

It is a snapshot, not a feed: it refreshes when you deploy. Group 38d, all three
guards mutation-confirmed. Gzip+base64 because the real ledger is ~250KB and
deflates to 49KB inlined; `entry.jsx` inflates it with `DecompressionStream`,
the same primitive the version store uses, so `app.jsx` never learns how the
seed was packed.

### Storage split (important)

`app.jsx` never touches a storage API directly — everything goes through
`window.storage`, `window.photos` or `window.versions`, and `entry.jsx` is the
only place localStorage or IndexedDB may appear.

`window.versions` is a **separate IndexedDB database**, not another store bolted
onto `mailday-photos`. Adding a store means a version bump, and an upgrade that
fails takes the whole connection with it — photos are irreplaceable and versions
are a convenience, so they must not be able to hurt each other. Inside it, two
object stores: `meta` is small and read every time the History panel opens,
`blobs` is large and read only on an actual restore. Keep them apart —
IndexedDB's `getAll()` hands back whole records, so a single store would
materialise every saved ledger just to render a list of dates. Snapshots are
gzipped with `CompressionStream` (built into Safari, no dependency; ~235KB of
ledger JSON becomes ~25KB — measured 65,756 → 5,680 bytes, 11.6×), and the `gz`
flag rides in the metadata rather than being assumed. Keep them apart: the ledger is one small
JSON blob that has to save on a 500ms debounce, and photos are megabytes that
must never get near it. localStorage caps out around 5MB; IndexedDB scales with
free disk and stores Blobs without base64's ~33% inflation.

Note `shivinate7.github.io` is a single origin across every repo the user has
on Pages — hence the `mailday:` key namespace, and hence a per-origin storage
quota shared with any other Pages project.

**`window.remote` is transport, not storage.** It now carries photos as well
as the ledger, to a second (private) repo — but still speaks only ids and
blobs: `app.jsx` never learns a filename, exactly as it never learns the string
`"ledger.json"`. The naming rules live in `src/photo-rules.mjs` and are
imported only by `entry.jsx`.
 localStorage remains the source
of truth; the GitHub copy is a backup and the app is fully functional offline.

**Sync runs itself, and there is no toggle.** Push on a 90s idle debounce plus
backgrounding; the *merge* on a foreground after `RESUME_RESET_MS` away, and on
a cold mount. The `● Auto-push` toggle is gone — a per-device switch for "does
this work" turned the thing the app is supposed to do quietly into a thing you
had to opt into, and an off toggle on the other device is a silent way to be
unbacked-up for months. (`auto` survives unread in `entry.jsx`'s record;
removing a stored field is its own migration question.) What was rejected was *continuous* sync — a
push per check-in, at the 500ms save cadence — and that is still rejected: the
ledger blob is rewritten *whole*, and GitHub's secondary limit is 80
content-generating requests/min and 500/hr, shared with photos. The 90s debounce
is two orders of magnitude off that.

The repo-growth worry that argued against it turned out to be small, and there
are numbers: the real ledger blob is **235KB**, and all **19 pushes** of it
bundle to **39KB** — git deltas near-identical JSON to roughly 2KB a version.
At tens of pushes a mail day that is single-digit MB a year.

**The push and the merge guard on different things, and the difference is the
point.** The merge refuses while `composing`, `undo` or any armed confirm is
live, because it APPLIES a remote ledger and `applyBackup` nulls the first two.
The push refuses only on armed confirms: it changes nothing on this device, a
half-built envelope is not in the ledger yet, and a pending undo sits on top of
a check-in that genuinely happened and is already saved. Guarding the push on
them too was over-broad and it stalled — `undo` survives a trip to Packages by
design (group 14 pins that), so an assignment followed by a view switch stopped
all backup for the rest of the session, invisibly, because there is no undo
control outside Orphaned. Test 38b.3b. (`composing` is additionally cleared when
you leave Orphaned, because the composer's draft lives in local state inside
that view and is already gone by then — the flag was outliving the thing it
described.)

**Auto-push is safe only because the merge exists.** Automating it without
`merge-rules.mjs` would turn the conflict trap from something hit occasionally
into the normal way two devices meet. It is also why auto-push refuses to write
when `peek()` cannot see the remote: pushing on an unknown remote state is
precisely how one device overwrites the other.

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
2. **Saved-state shape:** `{ items, received, envelopes, stamps, dateFilter,
   sortBy, itemSort, savedAt }`. `items` = array of parsed line items;
   `received` = map of item key → count received; `envelopes` = orphaned-mail
   records, each `{ id, createdAt, note, entries: [{ name, qty }],
   photos: [photoId], updatedAt }`. `updatedAt` is what lets the two-device
   merge tell a real edit from a stale copy of the same envelope; it is optional
   and defaulted (absent reads as 0), so envelopes written before it shipped
   keep loading untouched. It costs nothing under the five-site rule below
   because it lives *inside* `envelopes`, which is already persisted.
   `stamps` = map of **package** key (`gkOf`: `orderId::seller`, never
   `it.key`) → `{ kind, at, note, updatedAt }`, one per package; `kind` is one
   of `claim | refunded | contacted | reshipped | partial | other`, `at` the local
   calendar day it was set. **`kind: ""` is a tombstone** — a removal, kept so
   it can win a merge — and every reader goes through `hasStamp`, never key
   presence. Absent on older saves; defaulted to `{}` through
   `sanitizeStamps`, because `parseLedger` validates only `mailday` and
   `items`.
   Item key = `orderId|itemNumber|vendorProductId` — stable across re-imports;
   never change its construction. Envelope entries store card **names**, never
   item keys, so a re-import can't rot them and newly imported older orders
   become candidates for free.
   New keys must be optional and defaulted in the load path (as `itemSort`,
   `envelopes` and `photos` are), so saved states written by older builds keep
   loading. `itemSort` briefly shipped as `cardSort`; the load path still reads
   that key as a fallback.
   Saved **versions** cost nothing here, and that is by construction:
   `takeVersion` is a third *reader* of `snapshot()` rather than a fourth
   builder, and every restore path — file, pull, merge and the History list —
   funnels through `applyBackup`. `stamps` is the proof: it shipped after the
   version list and needed no change to it. Give the list its own payload
   builder and the next person to add a persisted key silently ships a rollback
   that drops it. Test 39.8b.
   Adding a persisted key means touching **five** sites:
   the load effect, the save payload + its dep array, `backup`, the JSON restore
   branch, and `resetAll` — miss the last one and the next debounced save writes
   the stale value straight back. Photo *blobs* are not in here at all; only
   their ids are (see Envelope photos below).
   The count stays **five**, not six, because the download and the GitHub push
   share one payload builder — `snapshot()`. Give the push its own and the next
   person to add a key misses one. The push carries no timestamp for the same
   reason: it goes in the commit message instead, so the pushed bytes stay
   identical to what the Backup file has always contained.
   **Plus one outside `app.jsx`:** `mergeLedger` in `merge-rules.mjs` builds
   the merged ledger from named fields, so a key it does not name is dropped by
   every merge, applied as a full replace, and pushed — both devices lose it.
   `stamps` was the first key added after that builder existed; test 37.62
   pins the key's presence. A related rollout hazard: an older build's
   `snapshot()` omits `stamps`, so its next push publishes a ledger without
   them and a Pull onto the new build wipes them (a Merge keeps the local
   ones). Update both devices before stamping anything.
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
   received or filters change (the resume reset clears them too, which is why
   it waits out `RESUME_RESET_MS` rather than firing on every glance away);
   sort order is snapshotted (frozen) while
   checking and re-computed only on sort/filter changes; packages never
   auto-collapse mid-interaction. In the Tally view the sticky rule is
   stricter — a *completed item* also stays until filters change, because most
   items have a single copy and vanishing on every tap would recreate exactly
   the mis-tap cascade this invariant exists to prevent.
   **And the card itself must not change height on that tap** — see "The card's
   reserved geometry". The rows inside a package are as much under the thumb as
   the list is, and before that was fixed the first check-in in a package moved
   every remaining row in it down by 28px.
6. **No native browser dialogs.** `window.confirm`/`alert` block the whole page
   and look wrong in a home-screen app; every destructive action uses an inline
   two-tap confirm instead (Reset, Discard, Assign, **Pull**, **Push anyway**,
   **Remove stamp**, **Restore**). Keep that pattern. (This started as a sandbox limitation
   and outlived it — it's now a UI choice.) With four armable controls in the
   main component, arming one **disarms the others** via the shared
   `arm`/`disarm` pair: two primed destructive buttons side by side is the
   exact mis-tap the pattern exists to prevent. `arm` takes a *value* rather
   than always setting `true`, because **Restore** has one button per version on
   screen at once, so "which one is primed" has to be an id; disarming is still
   a single call. Tests 26.17–26.19, 39.14–39.15. `PackageCard`
   carries its own local pair for Remove stamp, as `EnvelopeCard` does for
   Discard and Assign — one timer, one armed control, cleared on unmount.
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
basis, **Orphaned**, **envelope photos**, **Push / Pull**, the **two-device
merge and auto-push**, and the **resume reset on Showing**, which are newer and
so far verified only by `npm test`.

Auto-push is the one thing here with a *field* record, and it is a bad one: its
first day of real two-device use destroyed a check-in. Not because the merge was
wrong — replayed against the two real ledgers it is correct — but because the
adapter advanced the stored sha before the app had applied the bytes, which let
a stale ledger push with no conflict. Fixed and pinned by group 35, and the
reason the sha rule is written out at length under Push / Pull. Treat the rest
of this paragraph's list as genuinely unproven, not merely untested. The
camera path in particular has never run on a real iPhone, and neither has the
resume reset — jsdom can prove the listener is wired and the arithmetic right,
but whether iOS fires `visibilitychange` on a home-screen app's return is
WebKit's call; and no request has ever gone to the real GitHub API — the
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
  (only when partially complete, and drawn as a 3px rule on the card's top edge
  rather than as a row inside it — see "The card's reserved geometry");
  contextual "Mark all received" / "Clear check-ins", in a row held at a
  reserved height for the same reason; rotated RECEIVED stamp replaces the
  count badge when complete.
- Whole-row tap to toggle; 2-line name wrap; qty stepper for qty>1 with
  indeterminate-dash partial state.
- Search (card/set/seller/order), Showing (the old "Hide received", which now
  starts on Unreceived every session — see the ruled head), date filters (All/30/45/60/90,
  free "# days" input, custom from–to) — shared by the two ledger views and
  hidden entirely under Orphaned.
  **A search filters *inside* a package, so every result needs a way back to
  its whole order.** One matching line draws a card that looks like a complete
  one-line order, which is the wrong thing to believe with the envelope in your
  hand — and the way out used to be "clear the search and hunt for the seller",
  which on an iOS keyboard costs enough that nobody does it. So: `revealed`, a
  set of package `gk`s that ignore the filters and render the whole order, with
  two entrances. In **Packages**, a filtered card carries a footer
  — `+4 more lines in this order · show all` — which reveals *that* package
  and leaves the other results filtered, so near-duplicate candidates can be
  compared side by side. In **Tally**, each source copy's order id is the
  control (underlined, with a `›`): it reveals that order, switches to
  Packages and scrolls to it, **leaving the search untouched** so one tap on
  the view switch comes straight back.
  Three things here are load-bearing. A reveal ignores **hideDone as well as
  the query** — otherwise the jump lands on nothing whenever the tapped copy's
  package is fully checked in, and the "+N more" count promises lines the
  hideDone filter then swallows. Reveals clear on `query`/`dateFilter` but
  deliberately **not** on `view`, because the jump sets `revealed` and `view` in
  one handler and a `view` dep would wipe it on the very next commit. And the
  order-id button **stops propagation**: the row it sits in checks a card in on
  any tap, so without it a navigation gesture would silently write to the
  ledger — the exact mis-tap invariant 5 exists to prevent. `revealed` is
  ephemeral UI state, never persisted, so invariant 2's five-site rule does not
  apply to it. Group 32. Package sort (newest/oldest/$ remaining/
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
  **Refunded and partial-refund stamped packages leave the same way** — see
  the next bullet.
- **Order stamps** — one per package, set by hand: `Claim filed · Refunded ·
  Seller contacted · Reshipped · Partial refund · Other`, dated the day it was set
  (local calendar day, not UTC — the same trap the month picker documents),
  with an optional free line. Picking another kind **replaces** it and
  re-dates it; editing only the note keeps the date. Rendered as a band under
  the package header — a rotated chip in the RECEIVED stamp's construction,
  manila rather than green, then the note in Cochin italic — visible while the
  package is collapsed too. Two entrances, one editor: the first stamp comes
  from a `Stamp` button placed first in the expanded card's action row; once
  one exists that button goes away and **the band itself is the control**
  (trailing `›`, like the Tally order-id link). The editor is the six kinds
  as option cells in the month picker's treatment — `Other` last, for
  anything the fixed five don't name, with the free line carrying the detail —
  the note field (16px or iOS zooms), a two-tap *Remove stamp*,
  Cancel and Save.
  `Refunded` and `Partial refund` take the package out of **every count and
  the normal list**, exactly as a canceled order is — the money is back, so
  nothing is outstanding. One chokepoint: `liveItems` excludes refunded
  packages the way `activeItems` excludes canceled ones, and totals, Tally,
  and the Orphaned candidates all inherit it. So stamping an order Refunded
  makes its card **vanish from the list under your finger** — the precedent
  is "Mark all received" under Unreceived, and the `N stamped` cell is the
  signpost. That cell, beside `N canceled` in the Find row, is a **filter on
  top of the normal pipeline**: the date range, Showing and Find all still
  apply (so a stamped, fully received package stays hidden under Unreceived,
  and the count can read higher than the list, exactly as `N lines` can).
  Refunded packages are sourced back in while it is on — `stampedPackages`
  comes from `rangedActive`, the in-range items *before* the refund exclusion
  — with a manila `N left · refunded` pill in place of the red figure. It is
  the only place a refund can be found and un-stamped. `packageOrder` ranks
  whichever source is live, or a refunded package would sit last under every
  sort. Packages view only; Tally has no package to filter.
  The stamp's label and note are in the Packages search haystack, and a
  package-level hit keeps **every** line — filtering them would draw exactly
  the one-line-order lie group 32 exists to undo. The lost-mail warning is
  hidden on any stamped package, header line and Tally source row alike: the
  order is being handled, and for a reshipment the original date means
  nothing. `useGkSet` gives the refunded/stamped sets an identity that changes
  only with their *membership*, so a note edit never rebuilds `packages` and
  re-freezes the sort mid-check-in (invariant 5). Removal writes a tombstone,
  not a hole (invariant 2). Group 37.
- **Saved versions, and a History list to roll back from.** Gzipped snapshots
  in their own IndexedDB store, listed newest first —
  `14:32 · before import · 806/481` — expanding to the delta against now and a
  two-tap `Restore this version`. Four tiers, and the important half is *when*
  each is taken. **Milestones** go in immediately BEFORE each of the operations
  that can lose data in bulk — import, sync, restore, reset — so each holds the
  world as it stood in front of the thing that might have ruined it. **Recent**
  ones are taken AFTER an ordinary change, so they hold where you got to; a 30s
  gate keeps a mail day's hundreds of taps from spending the ring on one
  package. The **day anchor** is derived, not stored (see `version-rules.mjs`).
  **A store that cannot write says so.** `takeVersion` used to fail into an
  empty catch and `refreshVersions` used `.catch(() => [])`. With IndexedDB
  unavailable — private browsing, quota exhausted by the photo store, iOS
  storage pressure — every version failed silently, *including the
  `before reset` milestone*, and History then reported "No versions saved on
  this device yet": affirmatively wrong rather than merely unhelpful, since the
  ledger would then be destroyed by a Reset the app had promised was
  recoverable. `versionsDown` carries that now, a failed write resets the 30s
  gate rather than also swallowing the next window, and an unreadable list never
  renders as an empty one. Tests 38b.4–38b.5.
  **A restore is not local, and now says so.** It rewrites `items`, `received`
  and `envelopes` — three of the auto-push debounce's deps — so ninety seconds
  later the rolled-back ledger is published, unattended and *accepted*, because
  the stored sha is still current and there is no conflict to raise. Nothing is
  destroyed (every push is a commit, and the other device recovers by merging),
  but the two-tap said "replace everything", which reads as local. The expanded
  row says "This becomes the backup too, a minute later" when there is a key.
  The same is true of `resetAll`, which keeps the sha by design: **a Reset
  publishes an empty ledger 90 seconds later.** Contained for the same reasons,
  and worth knowing.
  The sha itself is deliberately untouched by a restore, and rolling it *back*
  would be the actual mistake: it would 409 the next push against a remote this
  device is not behind, forcing the user through Merge — which only ADDS, and
  would therefore silently re-add the very lines the rollback removed. The
  repair path would undo the repair.
  Two consequences worth protecting. `resetAll` deliberately does **not** clear
  versions, which is what makes an accidental Reset recoverable rather than
  final. And a restore takes its own `before restore` milestone on the way in,
  so tapping the wrong row is survivable rather than a second disaster.
  **Older versions come off the branch itself**, behind a `Load older versions`
  tap. Nothing new is stored for it: every push has always been a commit, so
  `data` already *was* an archive — the missing half was reaching it without a
  laptop. `listVersions`/`getVersion` are both **reads**, so they spend nothing
  from the 500-content-writes/hour budget and neither needs a key on the public
  repo. Restoring one funnels through the same `applyBackup`, and deliberately
  does not touch the stored sha: rolling the ledger back is local, and pushing
  afterwards rolls the remote back as a *new* commit, which keeps that
  reversible in turn. Groups 39 and 41.
  The panel also carries **Backup** and **Backup + photos**, which moved out of
  the Sync panel — they are version actions, "save one off this device", and the
  Sync panel is now a repair kit that only opens on failure. The History cell is
  gated on the versions **adapter**, never on the ledger: it holds the one
  control that undoes a Reset, and gating it on `items.length` would make it
  unreachable exactly when a Reset has just happened.
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
- **An unreadable LOCAL photo store keeps every id, exactly as an unreadable
remote one does.** `applyBackup` and `surveyPhotos` both used
`photos.keys().catch(() => [])`, which reads "I could not look" as "this device
holds nothing" — so with IndexedDB unavailable every id not already on the photo
remote was stripped, the debounced save wrote the stripped ledger, and the next
push published it. The remote half of this rule is argued at length below and
pinned by 26.13b; the local read never got the same treatment. It is
three-valued now: `applyBackup` keeps every id when the store will not answer,
and `surveyPhotos` returns `null` rather than planning a sync it cannot survey
honestly.

**Photo ids on restore: keep an id when its blob is inlined in the payload,
  already present on this device, OR known to be on the photo remote; strip
  only the rest.** This used to be
  all-or-nothing on `data.photos`, which is right for a file restore onto a
  fresh origin and silent data loss everywhere else. A pushed payload never
  carries photos (they stay local by design), so pulling onto the very device
  that took them stripped every id — and the sweep effect then deleted the JPEGs
  from IndexedDB two seconds later, with nothing to restore from. The same bug
  was already latent on the file path (plain Backup → restore on the same
  device); it was simply rarely exercised. Tests 19.11–19.12, 26.11–26.13.
  The third arm (`extraPresent`) came with photo sync and matters in two places
  a narrower rule would lose data: one GET failing out of twelve would strip
  that one id, the debounced save would write the stripped ledger and the next
  push would publish it — severing the link to a photo sitting safe on GitHub
  that a retry would have fetched; and when the photo repo can't be reached at
  all, every id would go at once. **Keeping an id costs a blank manila tile
  until the next pull. Stripping it costs the photo.** So 26.13 split: strip
  only when the store was actually *read* and genuinely didn't hold it (26.13),
  keep when we couldn't look (26.13b).
- **The stored sha is accepted only after the bytes are applied.** `pull()`
  returns the sha; `acceptPull()` stores it, and the app calls that *after*
  `applyBackup` has landed. This is the rule the whole conflict scheme rests on,
  and it was learned the expensive way — see the note below.

  The stored sha is this device's **claim to be holding the remote's bytes**.
  The adapter originally wrote it the instant they arrived, which makes the
  claim true only if the app then applies them. When it doesn't — a payload it
  rejects, a merge that throws, a generation guard that bails — the device sits
  on a *current sha over stale data*, and its next push carries that sha and is
  **accepted**: no conflict raised, the other device's work destroyed. Auto-push
  made that automatic and unattended, within 90 seconds.

  It happened on the first day of real two-device use and cost a check-in.
  `git log origin/data` has the receipt: `87793de` is **byte-identical to
  `38017ae`, six days older**, landing on top of a newer ledger with no
  conflict. Diff the blobs, not just the counts — identical blobs are how you
  tell which device wrote what.

  Failing to accept leaves the device merely *behind*, which conflicts loudly on
  the next push. That is the direction this must fail in. Group 35.
- **Merge (the conflict's way out).** Pull and Push anyway are the two halves of
  the same mistake — each keeps one device's work by discarding the other's.
  `Merge & push` keeps both: pull, union, apply, push. It carries **no two-tap
  arm**, deliberately, because it destroys nothing and invariant 6's pattern is
  for destructive actions specifically; arming it would say the opposite of what
  it does. Two entrances, one function (`doMerge`): the conflict, where it also
  completes the rejected push, and the *ahead-notice*, where it does not (there
  may be nothing local to send, and an empty commit is noise).
  The ordering inside it is the same one `doPull` depends on — **photos are
  fetched before the ledger is applied** — and for a sharper reason: the merge
  unions both devices' envelopes, so ids arriving from the other device have no
  blob here yet and `applyBackup` would strip every one of them.
- **`peek()`, and auto-push.** `GET /git/trees/{branch}` returns the **blob**
  sha for `ledger.json` — the exact value `push` stores and `rec().sha` is
  compared against — for a few hundred bytes on the *read* budget rather than
  the ~470KB a Contents GET would spend to answer the same question. It runs on
  foreground, never on a timer, and it is **three-valued** for the same reason
  `listPhotos` is: "I could not look" must never render as "all clear", because
  that is the state in which pushing overwrites the other device. Auto-push
  (unconditional now — there is no toggle) looks before every write and declines
  on `ahead` or on unknown; a conflict opening between the look and the write
  resolves by merging rather than leaving `Push anyway` armed on a screen nobody
  is watching.
  **The same `peek` is now also the auto-merge's trigger**, which is why it is
  one read and not two, and why the merge sits inside its `known` branch. The
  foreground call does three things at once: reports whether the remote is
  ahead, licenses or refuses the merge, and — via `freshSession` — decides
  whether this foreground was a new session at all.
- **Push / Pull (GitHub).** Automatic backup to `ledger.json` on the
  **`data` branch** of `shivinate7/mailaudit` — never `main`, because Pages
  deploys from main's root and every backup would otherwise trigger a site
  rebuild. Push needs a fine-grained PAT (`Contents: read & write`, that repo
  only) pasted once per device — and since the repo went private, **pull needs
  that key too**. This used to read "pull needs no key at all", which was the
  property that let a fresh device recover before it had been set up; closing
  the world-readable ledger cost exactly that, knowingly. A device with no key
  can now do nothing remote at all, which is why `no-access` is a `syncBroken`
  case with its own line rather than an error buried in a panel.
  Conflict detection is the Contents API's blob sha, and the sha sent is the one
  *this device last saw* — never one re-fetched moments earlier, which would
  make every push win and silently discard the other device's. A stale push
  reports the conflict and changes nothing; `Push anyway` (two-tap) is the
  escape hatch, and it is safe-ish because every push is a commit, so what it
  overwrote is still in the branch's history. A bad *pull* has no such
  recovery — which is why Pull gets the two-tap and Push doesn't.
  **`pushForce` hands its looked-up sha to the PUT rather than storing it
  first.** It used to `saveRec({ sha })` before writing, which made the force
  the one remaining place recording a claim to hold bytes it had not written —
  and when that PUT then failed (offline, throttled, a 409 racing the photo
  repo), the device sat on a *current sha over stale data* and its next
  auto-push was **accepted with no conflict raised**. Verbatim the incident
  below, reached through the force door instead of the pull. `push()` takes an
  optional sha override for exactly this and records it only once the bytes are
  on GitHub. Tests 35.6–35.7 pin it at the app level; the adapter is unreachable
  from the suite, so the mock was corrected to match — it had mirrored the same
  ordering *and* cleared `remote.fail` on the way in, so a force could never
  fail and nothing could ever have caught this.
  **Photos go too, to a different repo.** `shivinate7/mailaudit-photos`,
  **private**, branch `main`, one file per photo at `photos/<id>.<ext>`.
  Privacy used to be the whole reason for the split — a mailing label carries a
  delivery address, and the ledger repo was public. That argument is gone now
  that both repos are private, and the question of merging them is a fair one.
  Two reasons survive it, and they are why they stay apart. **GitHub's 409 on
  rapid successive Contents writes is per-repo** — it is why the photo phase has
  its own error table and must never touch `pushState` — so merging would make
  that collision routine instead of rare. And **git is permanent while the app
  repo is the one you clone**: the ledger's entire history is 39KB, and every
  photo ever taken would live in it forever, with no undo. Push and Pull each
  do both legs in one tap — ledger first, photos after.

  The whole algorithm is a **set difference over ids**. A photo file is
  immutable and addressed by its id, so every remote path is written exactly
  once by whoever holds it: nothing merges, nothing overwrites, there is no
  second sha to track, and **photo sync cannot conflict by construction**. That
  property is why one-file-per-photo beat both a manifest (mutable, needs its
  own sha machinery, can drift from the directory, saves zero requests) and the
  Git Data API (one tidy commit, but a ref update needs a parent sha, so two
  devices backing up at once would genuinely collide). Protect it.

  Three things that are load-bearing and non-obvious:

  - **The photo phase has its own state and its own copy table (`PHOTO_SAYS`).**
    It must never write `pushState`, because `pushState === "conflict"` is the
    only gate on **Push anyway**, which force-overwrites the *ledger*. GitHub
    answers 409 to rapid successive Contents writes on one repo, so routing a
    throttled photo upload through the ledger's error path would offer a button
    that silently discards another device's check-ins. Test 30.11.
  - **A pull downloads before it applies.** See the restore bullet above: run
    `applyBackup` first and every photo id is stripped. Tests 30.5–30.9.
  - **`listPhotos()` is three-valued.** A 404 means "nothing pushed yet" on a
    repo you can see and "you can't see this repo" on a private one, because
    GitHub hides existence rather than admitting a 403 — verified live: a
    keyless request to `mailaudit-photos` 404s on both the tree *and* the repo
    itself. Collapse that to "empty" and a device with no key concludes every
    photo it owns is **lost**. So it answers `{known:true, ids}` or
    `{known:false, reason}`, `photoPlan` refuses to compute `lost` or `toPush`
    when it doesn't know, and a 404 is disambiguated by one extra
    `GET /repos/{owner}/{repo}`. Tests 26.13b, 30.13–30.15.
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
  `● Unreceived`) rather than as an instruction. **It starts on `● Unreceived`
  on every load.** The app is opened with mail in hand and the question is
  always "what is still outstanding"; landing on the full list meant a tap
  before the working view every single time. Like the range disclosure it is
  *not* persisted and does not belong in the saved shape (invariant 2) — it is
  the state each session starts from, and one tap brings the received rows back
  for as long as that session lasts. Tests 12.4–12.7; 12.7 pins the reload
  specifically, which is the whole point of it not being persisted.
  **A resume counts as reopening too.** On iOS a home-screen app is normally
  *backgrounded*, not closed — the page survives, so waiting for a remount
  meant the only thing that reset Showing was WebKit evicting the page, which
  can be days. A `visibilitychange` listener resets it when the app comes back
  after `RESUME_RESET_MS` (60s) away. The threshold is the whole design: a hop
  out to read a tracking number and straight back is the same session, and
  flipping the list under a thumb mid-check-in is exactly the mis-tap
  invariant 5 exists to prevent. Showing resets, **and an ahead remote is merged
  in** — two consequences of one finding, landing seconds apart (this one
  synchronously, the merge after a network round trip). Two reshapes of the same
  list on one resume is fine precisely *because* it is a resume: nothing is
  under the pointer. The query, the range and the reveals still do **not**
  reset — those are things you were in the middle of. Tests 12.8–12.9 and group
  40 pin both sides via `backgroundFor(ms)`, which is
  `background()`/`foreground()` with the clock frozen across the trip.

  **The elapsed time has to be handed forward, not re-derived, and this is the
  trap.** The resume handler computes `away` and then nulls `hiddenAt` before
  returning — and it registers *first*, because it has `[]` deps while the peek
  effect waits on `loaded`. Anything downstream that reads `hiddenAt` therefore
  measures zero forever and the merge never fires: no error, nothing on screen,
  nothing to notice. So the handler records into `freshSession`, on **both**
  branches (a short hop must be able to cancel a stale signal), and the peek's
  `check()` consumes it synchronously on every path out — that effect also runs
  on mount and on every `syncBusy` flip, and a merge flips `syncBusy` twice, so
  a surviving flag would let the other device's push land mid-session with no
  resume in sight. `freshSession` starts **true**: a cold mount is a new session
  too, and the more valuable half, since a fresh phone should come back already
  reconciled rather than needing someone to go looking for a control.
- **Sorted by** — opens a panel of options. There is no `<select>` in the app
  any more.

Then a **Find** row carrying search, with the canceled reference beside it as
another ruled cell rather than an underlined link floating on its own line, and
the `N stamped` filter beside that in the same cell style — `○/●` and
`aria-pressed` rather than the canceled cell's caret, because it is a filter
state (the Showing cell's idiom), not a disclosure. The row now holds two
`flexShrink: 0` cells and the search input absorbs the loss; re-measure at
375px if either label grows.
Then the **action row** — Re-import CSV / Sync / Reset — as equal ruled cells
at full width, uppercase mono like the view switch, 40px tall like Find.
File management is not a filter, and the row used to say so by changing
*idiom*: three boxed mono buttons pushed to the right edge, under a region made
of hairlines. That kept the separation and broke the page — a tray of buttons
in a different vocabulary, a void to their left that grew to ~450px at desktop
width, and a Sync panel that opened left-aligned under a chip that sat right.
The separation is kept by *treatment* now: the head cells are label-over-value
state, the action row is bare uppercase actions, and the thin rule above it is
the line between them. It is `.mdl-acts` in the `<style>` tag rather than
inline styles because its membership is conditional — one cell on an empty
ledger, three with a remote, four without — so the columns come from
`grid-auto-flow: column` and the divider is each cell's own right rule with
`:last-child` dropped; "last" can't be a prop the way `headCell`'s is.
Sync carries the only caret; it turns accent when open, and the whole cell
turns accent when `peek()` says the other device is ahead — colour rather
than a badge because the cell is one third of 375px. Reset is red text at
rest; **armed, it takes the whole row** (red fill, "Tap again to clear
everything") and the other two cells step out for the four seconds it lasts.
That is the better two-tap, not a compromise: the target grows over the spot
just tapped instead of wrapping to a new line under it, and the two controls a
mis-tap could land on aren't there to land on.

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

**The disclosure panels carry no fill.** `panelWrap` is padding plus a top
hairline and nothing else. It used to set `background: C.card`, which painted a
beige rectangle ruled top and bottom whose left and right edges simply stopped —
square-cornered and full-bleed to the column, in an app where every other filled
surface is a rounded inset card. The fill was the only thing creating an edge to
resolve, and it contradicted the region's own thesis. Don't reintroduce it: the
option grids still read, because `optGrid` paints `line` and each `optCell`
paints `card` over it, so the cells sit slightly raised against the page.

**History and Sync close each other**, the way the range and sort cells already
do — both panels are several hundred pixels tall and stacked they push the
packages off the screen. An armed Reset closes both, since it already hides the
cells that open them; leaving the panels up with no control was the same
one-way-door shape as the line itself.

**The upload zone opens on an empty ledger only when there are no envelopes
either.** It used to be forced open by an empty *item* list alone, which made
the Re-import cell beside it — deliberately kept reachable when envelopes exist,
test 23.2 — a disclosure that flipped `aria-expanded` over a panel that was open
regardless. Tests 23.2b–23.2d.

**On the happy path there is no sync vocabulary on screen at all.** No `Sync`
cell in the action row, no toggle, no `Merge`, no "the other device is ahead"
notice. Sync happens or it doesn't, and the only case worth a pixel is the one
where it has *stopped* — because a ledger that quietly stopped reaching GitHub
is exactly the failure the remote exists to prevent, and it is invisible by
nature.

So there is **one line**, advisory manila, full width above the ruled row (a
sentence has to wrap; the row's cells are a fixed 40px of uppercase mono), and
it is the sole entrance to what is now a repair kit: `Not backed up since
Aug 30 — tap to fix`. `syncBroken` decides, in priority order: a conflict, an
errored last attempt, **being behind**, no key on this device, never pushed, or
a successful push older than `SYNC_STALE_MS` (24h — the push is automatic and idle-debounced, so
anything shorter fires on an ordinary evening with the phone face down, and
anything longer stops being a warning). It is deliberately **not gated on there
being local data**: a device with an empty ledger and no key is the fresh phone,
and this line is its only route to the Pull that recovers it. Test 28.1.

**`ahead` is one of its cases, and leaving it out was the worst hole the silent
sync opened.** Auto-push declines while the remote is ahead, and the auto-merge
only fires on a *fresh session* — so a device that goes behind mid-session stops
backing up entirely, for the rest of that session. The manila "pushed newer
lines" advisory still exists but lives *inside* the panel, whose only entrance
is this line, so it could only be found by someone who already knew to look. And
the 24h staleness backstop could not rescue it: `syncBroken` is a `useMemo` that
reads `Date.now()`, and a stalled device changes none of its deps, so that
comparison is frozen too. Tests 38b.1–38b.3.

**`remoteInfo == null` returns `null`, not `"no-key"`.** It is null until its
effect runs, one commit after first paint, so reading it as "no key" flashed the
manila banner on every cold start of a perfectly configured device. Same
three-valued rule `peek` and `listPhotos` follow: "I haven't looked" is not "all
clear", in either direction.

**It renders on `syncBroken || syncOpen`, and it is a TOGGLE.** Both halves were
learned by shipping without them, and the bug was reported from the phone within
the hour. It opened on tap and nothing closed it, because removing the Sync cell
had taken the only control that could — and worse, the moment you fixed the
thing it was complaining about, `syncBroken` went null, the line disappeared and
the panel was stranded open with no control at all. **A disclosure has to be its
own way back out.** While the panel is open the line is that panel's header, so
when the sync is healthy it goes quiet (`Backed up 09-06 — tap to close`,
transparent rather than manila) instead of vanishing — a header reading "not
backed up" over a ledger that just pushed would be a lie. Tests 28.8–28.12, both
halves mutation-confirmed.

The same session found a hole in the harness this had been hiding: the remote
mock set `pushedAt` to the frozen `REMOTE_NOW` (2026-08-12), so **every fixture
was permanently past `SYNC_STALE_MS` and the healthy state — `syncBroken ===
null` — was unreachable from a test.** It is `Date.now()` now; the frozen clock
is there so payload snapshots don't depend on the wall clock, and this is status
metadata that nothing asserts on.

The action row keeps its three equal cells — **History takes the one Sync
vacated**. Behind the line: Push, Merge, Pull, Push anyway, the target line and
the key field. `Merge` still appears on a conflict *or* when `peek()` says the
other device is ahead, for the case the automatic path could not finish. One
accepted cost, chosen rather than overlooked: a device whose sync is healthy has
no way into the panel, so a key cannot be rotated *proactively* — in practice a
token needing replacement has expired, which errors, which raises the line.
`Merge` is filled **accent violet** — the app's "this is the live control"
colour — because it is the safe resolution and therefore the primary one, while
the force beside it stays advisory manila. The panel is the same `panelWrap`
surface as the date and sort disclosures **and now the same contents**: an
`optGrid(2)` of action cells over a block of *particulars*. The actions are
built as data (`syncActions`, just above the component's `return`) because
the grid has to know the count — an odd last cell spans the row, or the rule
colour shows through the empty half as a slab, the same trick the range panel
uses. Two columns everywhere, like the sort panel: "Pull from GitHub" and the
armed "Tap again to replace" both need the ~160px a half of 375px gives them
and neither fits a third. Each entry carries its own colour, because the grid's
one accent means "on" and these mean five things: Pushed ✓ green text, Merge
accent fill, Push anyway manila (manilaInk fill when armed), Pull red fill when
armed, Auto-push the accent fill when on and inkSoft when off. The particulars
(`partGrid`) are the head cells' two parts laid on their side — `LEDGER` /
`PHOTOS` / `KEY` micro-labels beside mono values — replacing a target line
that floated after the buttons as bare text. The value track is
`minmax(0, 1fr)` so the 44-character photo target wraps inside it at 375px
rather than pushing the panel past the page. The token field is a write-on
rule like Find, not a box, and it is **16px** because iOS zooms the page on
focusing any smaller input and the viewport meta deliberately leaves zoom on;
the old 12px box zoomed on every paste. Re-import and Reset stay on the
narrower `items.length > 0 || envelopes.length > 0` gate; Sync survives it,
because an empty ledger is exactly when Pull is needed. Group 28.

Every control inside the panels shares one height — `CTL_H`, currently 34px
— via `optCell`, the day-stepper `well` and the token `keyField`. Before
that existed, chips were `5px 11px`, selects `9px 8px` and buttons
`9px 12px`, so nothing shared a baseline and the rows wrapped raggedly;
**that mismatch, not the colours, is what read as unfinished.** Change
`CTL_H` and every panel follows. The boxed `ctl`/`chip` controls the
constant was written for are gone — the last of them, the file actions and
the Sync panel's buttons, became the ruled action row and an option grid — so
nothing in the region is a rounded box any more. Note `keyField` sets
`boxSizing: border-box` because inputs are content-box by default while
buttons are not; without it the field renders 2px taller than the Save cell
beside it.

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

The action row was then re-measured in real Chromium against the user's actual
ledger (793 lines, 3 envelopes), old build and new through the same script,
from the top of the view switch to the top of the first card: at 375px
**214px → 203px at rest** (the 40px ruled row replaces a 51px padded tray),
armed Reset 256px → 203px (it no longer wraps onto a second line), an empty
ledger 69px → 58px, and every one of 24 width × state combinations at 0px
horizontal overflow. The one figure that went the other way is the open Sync
panel, **357px → 419px at 375px** (320px → 406px at 760px): the two-column
option grid stacks three rows where the flex-wrap fitted two (one at 760), and
the particulars sit on three ruled lines instead of two crammed ones. That is
paid only while the disclosure is open, and it buys the panel looking like
its two siblings rather than like the tray the region replaced. At 375px the
three action cells measure 114.3px each and the grid's halves 161px; the fits
worth re-checking if the type changes are "SYNC · 09-02 ▾" in a third and
"Tap again to replace" in a half.

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
violet and read as flat black on parchment. The two card bars carry the same
colours but no radius of their own: they lie on their card's top edge, where
the card's 10px corner already rounds them, and a pill there would read as a
second smaller shape floating inside the first. The masthead's keeps its pill.

Orphaned follows the same language: manila for anything advisory (the
ambiguity warning, the "as typed" row, the "no outstanding copy" tag), green
only on an exact match and the armed check-in confirm, red only on Discard.
Photo thumbnails are 56px squares; the viewer is a full-screen ink scrim, tap
anywhere to dismiss.

### Motion

The app moves now, and the register is **stationery, not software**: ink
settling into paper, a seal pressed, a stamp rocked onto a page, rules drawn
like a pen stroke, gold catching light once. Nothing springs, nothing bounces
past its rest and hangs there. The one overshoot in the whole sheet — the
stamp's `+1deg` — is the wrist roll that inks a rubber stamp's edges, and it
returns *through* rest rather than oscillating around it.

Everything lives in one commented block in the `<style>` tag, under a single
rule that is not a style preference: **nothing may reflow.** Every keyframe
touches opacity, transform, colour or box-shadow and nothing else. That is
invariant 5 restated as a stylesheet constraint, and it is why the sliding
switch fill is an absolutely positioned element rather than a background moving
between three buttons, and why the check tick is drawn with `stroke-dashoffset`
inside a box whose 30px never changes. Measured in a real 375px viewport across
a check-in: the row's height, the indicator's 30×30 and the document width all
drift **0.00px**, and horizontal overflow stays 0 in every state.

Seven moments:

- **The letterhead composes itself, once per load**, in the order a page is
  actually made: wax, rules, name, house, figures. The seal is pressed
  (`mdl-press`, 600ms, .68 → 1.06 → 1), its specular catch comes up once the
  wax is down and still (`mdl-shine`, 420ms in), the gold rules are drawn
  outward from it (`mdl-draw`, scaleX, each pulling from its inner end), then
  the title, house line and tallies settle. Five overlapping beats landing at
  600 / 900 / 920 / 940 / 970 / **1060ms**.
  The first cut ran the whole thing inside 700ms and **read as one blur rather
  than as a sequence** — the ceremony needs the room. The price was chosen
  knowingly by the owner and is the thing to re-examine if this is revisited:
  **the tallies arrive last**, and they are the figures the app is opened to
  read. Two guard rails if you retime it — keep the final beat under ~1.1s, and
  never let the tallies start after the house line.
  `mdl-shine` is scoped to `.mdl-head .mdl-seal`. The running head renders a
  second `<Seal>`, and it is deliberately not selected: its highlight keeps the
  `opacity="0.22"` presentation attribute throughout, which is also exactly
  what the masthead's falls back to under reduced motion.
- **The view switch is one object being moved, not three lamps being lit.**
  `.mdl-thumb` is the violet fill, absolutely positioned at exactly a third of
  the track and translated by whole multiples of its own width, so it lands on
  the thirds the grid already defines and cannot drift out of step with them.
  The buttons no longer paint their own background — a button that did would
  leave a fill behind wherever the thumb had just been, and there would be two
  of it mid-slide. **The consequence to know: `data-view` on `.mdl-switch` is
  now the only thing saying which segment is active.** Drop it and the app has
  no active-view indicator at all, and every button still looks correct in a
  DOM dump. Tests 43.1–43.2.
- **The RECEIVED stamp lands** rather than blinking into being: down at −13°,
  rocked flat, settled back to its −4°. The order-stamp band uses the same
  keyframes and returns to its own −3° — the resting angle rides in a `--rest`
  custom property, so one animation serves both.
- **A completed package is gilded.** One pass of gold across the card, on the
  same beat as the stamp. This is where the completion moment actually lives:
  the per-package progress bar is mounted only while `gotQty > 0 && !done`, so
  it is *gone before it can ever render at 100%* — the bar cannot mark its own
  completion because it does not survive it. The card does. The band is the
  ornamental gold, which is never allowed to carry information, and here it
  carries none.
  That gate is now load-bearing in a second direction, and the reason is worth
  knowing before anyone touches the bar: it survived the fix for the 28px card
  shift **only because the bar was taken out of flow rather than reserved a
  slot**. A reserved slot would have to stay mounted at 100%, and the bar would
  then sheen its own completion next to the gild. See "The card's reserved
  geometry"; test 44.5 is what fails if it is put back.
- **The check tick is written**, one stroke left to right, 300ms. That ceiling
  is not a preference either: this fires hundreds of times on a mail day and
  anything slower starts to feel like latency. The glyph is an SVG path rather
  than the `✓` character purely so it *can* be drawn; the `aria-label` carries
  the meaning either way, and the partial state stays a typographic dash
  because a half-drawn stroke would read as a tick still arriving.
- **The masthead progress bar** takes its green a beat after the width lands,
  so the two read as cause and effect rather than one event, and sweeps once.
  It is reachable but rare: 100% there means every card in the ledger has
  arrived, which is the largest thing this app has to say.
- **The disclosure panels arrive** (220ms, opacity and 4px). The space they
  take is *not* animated and must not be — it is the same layout they have
  always pushed down, one commit after the tap.

**`useJustBecame` is the load-bearing piece and the one to protect.** Every
celebration here marks a state a package can already be *in*, so a bare CSS
class would replay its animation each time React rebuilt the tree: switching
Packages → Tally and back would restamp every finished order at once, and a
re-sort would do it again. The hook returns true only when its value rises
false → true **while the component stays mounted**, and never on a fresh mount.
It is also the more honest reading — the moment worth marking is the check-in,
not the fact of having been checked in. Tests 43.3–43.6; 43.4 and 43.6 are a
pair, and a mutant that classes the stamp on `done` alone passes the first and
dies on the second.

**Every rule is switched off under `prefers-reduced-motion`, and the resting
state is each animation's own final frame** — so `animation: none` leaves the
thing *drawn*, not hidden: the seal visible, the rules full width, the tick
complete, the stamp at its inline angle, the thumb on its third. Verified by
forcing the reduced-motion block on unconditionally in a real browser: seal
opacity 1, rules 104px, title and tallies opaque, thumb at 228.66px = 2 × the
114.33px third, overflow 0. With motion off the app is pixel-for-pixel what it
was before this pass.

Two things measurement, not reading, settled here, and both will need
re-measuring rather than re-reasoning if they change. **jsdom has no layout and
no compositor**, so durations, easing, distances and the no-reflow claim are
not assertable and no test protects them — group 42 pins only the two claims
that are behaviour. And **the Browser pane freezes animation timelines when it
is not compositing**, which makes sampled mid-animation values read as frozen;
pause with `getAnimations()` and set `currentTime` instead of sampling frames,
or the numbers will lie to you.

`_studies.html` is not in the repo, but the method that produced this is worth
keeping: each moment was built two or three ways as a side-by-side proof sheet
with every variable but one held constant, and picked by looking rather than by
reading a description.

### The masthead

The top of the page is one composed letterhead, not stacked boxes: a wax seal
between two gold rules, **MANIFEST** in Cochin caps, the C.H Postal Company
line, then the tallies folded in under a hairline. The stats used to be their
own bordered card and the two edges fought each other 20px apart.

The tallies are three ruled cells — cards, packages, value — each `done/total`.
**Not equal thirds.** The two counts are 7 characters (`480/800`) and the value
is 14–17 (`$45.8k/$77.66k`), so equal tracks starved the only cell that needed
room and left ~23px unused in each of the other two — the value ran into the
divider on its left, which is what got it reported from the phone. The value
cell is `flex: 1.7`; measured at 375px all three now land on the *same* headroom
(23.3 / 23.3 / 23.2px), and the six-figure case `$100.24k/$118.60k` fits rather
than clipping. Re-measure if the type size or the 6px cell padding changes.
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

**The tally footer's save indicator sits in a RESERVED slot, and that is
invariant 5 too.** `.mdl-foot` is a wrapping flex row holding three things —
`N packages · autosaves`, the exact `N still missing · $X`, and the debounced
save indicator. The indicator used to be sized by its content, which meant it
was 0px wide at rest and ~44px wide while saving, and a flex row that wraps has
no way to absorb that: whether the row is one line or two depends on where the
two figures happen to fall relative to the wrap point, so on the wrong side of
it the indicator *added a line* on every tap and took it away again 2.5s later.
By then the masthead has scrolled off and the thumb is on a card, so what
actually moved was the package list, twice per check-in — the cascading mis-tap
this invariant exists to prevent, arriving from the one element that changes on
every single tap. It predates the motion pass; it was never a regression from
it.

So the slot reserves `min-width: 13ch` — the longest of its three states,
`couldn’t save` — and the content swaps inside a box that never changes size.
**Reserving the width alone is not enough**, and getting that wrong looks like
a fix: an empty flex item is zero pixels *tall*, so a line holding nothing but
the empty slot collapses, and the shift comes straight back (measured: 14px
idle against 26px saving, with the width already reserved). The idle state
therefore renders a non-breaking space rather than nothing — one line box, no
hard-coded height. Change any of the three messages and re-measure: 13ch is the
longest one, counted.

Measured on the built page against the seeded ledger, 12 realistic figure pairs
× 4 indicator states at each of 320 / 375 / 390 / 430 / 760px: **height
constant in every pair, horizontal overflow 0 throughout**. Before the fix, 4
of 10 pairs at 375px moved by 12–14px. At 375px the row is 26px (two lines) for
every pair the seed can produce; at 760px it is 12px (one line). Group 42 pins
the mechanism underneath — jsdom has no layout, so the shift itself is not
assertable there and never will be.

**Re-measuring this is easy to get wrong, in three ways that each look like a
result.** Measure on a *clone* of `.mdl-foot`, never the live row: setting
`textContent` on a node React owns tears the tree down with a `removeChild`
NotFoundError. Set the idle state to `\u00a0` and not `" "` — HTML collapses a
plain space, so a plain-space "idle" measures as the *empty* slot and duly
reports the shipped build shifting 12px on 7 of 12 pairs, which is the bug
being reproduced by the measurement rather than found. And substitute the
figures: the seed's own pair (`478 packages` / `173 still missing · $6,066.20`)
is already 335px against a 327px row, so it is two lines in every state and
cannot move — only pairs small enough to share one line *without* the slot
discriminate at all.

One measured detail the "counted" above glosses: `couldn’t save` renders
82.19px against the 82.18px the reservation buys, because `ch` is the advance
of `0` and the curly apostrophe is fractionally wider. It does not shift today
— `min-width` is a floor, and that line has ~50px of slack — but the slot is
not literally covering its longest message, and 42.3 compares *character
counts*, so it catches a longer message and would not catch a same-length one
with wider glyphs.

What this does *not* fix, and is worth knowing: the two figures can still
change width on their own (`100 packages` → `99 packages`, `$1,009.00` →
`$999.00`), and on the wrap boundary that can reflow the row by itself. It is
far rarer than a save indicator that changes twice per tap, and the fix would
be to reserve width for figures whose whole job is to change. Left alone
deliberately.

### The card's reserved geometry

The save indicator above was the *smaller* half of this. The same defect lived
one level down and twice the size: measured at 375px against the seeded ledger,
**the first check-in in a package grew its card by 28px and pushed every
remaining row in it down by 28px** — inside the card, directly under the thumb
that had just tapped one of them. Invariant 5, on the most common gesture in
the app. It predates the motion pass and the save-slot fix and was independent
of both.

Two unrelated causes, each needing its own answer:

**The progress bar is out of FLOW, not reserved a slot.** It used to mount
between the header and the item rows on the first check-in, a 15px child
appearing above everything it displaced. It now sits on the card's own top
edge — `edgeBar`, absolutely positioned inside the card's existing
`overflow: hidden` rounded box, so the 10px corner does its rounding (hence
`ProgressBar`'s `radius` prop, separate from `height`, so this one is not a pill
floating inside another shape), it catches no taps, and it can mount and unmount
without moving anything. 3px, because it is a rule on an edge now rather than a
bar in a row.

Out of flow rather than reserved **for a reason that is not about layout**: it
is what lets the `gotQty > 0 && !done` gate stand. A reserved slot has to stay
mounted through completion, so the bar would render at 100% and sheen — and the
Motion section's gild is the sole marker of a package completing *precisely
because* the bar cannot survive to be one. Test 44.5 fails if the gate goes;
read that failure as "this is a change to the motion design", not as a broken
refactor. The Tally card was given `position: relative` for the same bar;
PackageCard already had one for `.mdl-gild`. Without it the bar escapes to the
nearest positioned ancestor and draws somewhere else on the page entirely,
which is why 44.2 and 44.7 pin both.

**The action row is reserved at its tallest state** (`BULK_ROW_H`, 44px of
content). Its membership changes on the same tap — "Clear check-ins" joins
"Stamp" and "Mark all received" — and at 375px those three want 60.6 + 143.7 +
129.9 plus two 8px gaps = **350px in the 313px a card gives them**, so both bulk
labels wrap to a second line and the row goes 31px → 44px. It shrinks by the
same 13px on the tap that *completes* a package, where "Mark all received"
leaves; reserving the tallest state pins both transitions at once. A counted
constant exactly like the save slot's 13ch, and stale the same way — two lines
of 11.5px mono plus `miniBtn`'s 8px padding. **The Tally card's row is
deliberately NOT reserved**: it has no Stamp button, so its two buttons are
282px of the same 313px, neither wraps, and it is one line in every state. Add a
third control there and reserve it then, measuring rather than assuming 44 fits.

Measured on the built page against the seeded ledger, rest → first check-in →
second → the tap that completes the package: **card height constant at 347.09px
and every item row displaced 0.00px**, horizontal overflow 0 in every state; the
Tally card likewise **496.09px constant, 0.00px shift**. Row content needed
against the 44 reserved, by width: 57 at 320px, 44 at 360 / 375 / 390, 31 at 430
and 760.

**So 320px is the one width this does not fully fix** — three buttons wrap to a
*third* line there and the row still steps 13px (the bar half is
width-independent, so 320 improves from 28px to 13px). Left deliberately: 320 is
below this file's own stated 380px floor and is not a viewport current iOS runs,
and reserving 57 would buy it by spending 26px of dead space in every expanded
card at the widths that are real. If it is ever wanted, the way to get it
without the dead space is to keep all three buttons mounted and hide the
inapplicable one — the row then measures itself at every width — at the cost of
the visible label wrapping at rest, which is a look and therefore a decision to
put to the owner rather than a fix to apply.

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
npm run check:build  # is the committed index.html the code in this repo?
npm run check:seed   # and what does the seed baked into it publish?
npm run deploy       # build + test + commit index.html + push (Pages auto-deploys)
```

**`check:build` compares the code and ignores the seed, and that is the design
rather than a gap.** `index.html` carries two things — the bundle, and a
snapshot of the ledger read off `origin/data` at build time — and only the
first is a claim about this repo. The second cannot be compared even in
principle: the phone rewrites `data` on a 90s idle debounce, so two builds
minutes apart legitimately differ. Diffing whole pages therefore fails one of
two ways, and CI managed the first — **always**, because `actions/checkout` is
single-branch, so the runner has no `origin/data`, builds seedless, and every
comparison differs (main was red for four runs on exactly this, while
`npm test` itself passed); or **at random**, if you fetch the branch and race
the phone. A check that cries wolf is worse than no check, because it trains
you past the alarm.

So `withoutSeed()` strips the seed from both sides. It lives in `build.mjs`,
beside the template that writes the tag, so the two cannot drift apart — and if
the tag's shape ever changes without it following, the check says so by name
instead of quietly comparing nothing. A stale *seed* is harmless in a way stale
*code* is not: a visitor sees a slightly older ledger and the next deploy
refreshes it. Verified all three ways in an isolated checkout: a clean tree with
no `origin/data` (CI's exact condition) exits 0; a source change with no rebuild
exits 1 saying "index.html is stale"; and a drifted tag shape exits 1 naming
`withoutSeed()`.

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
   only builds on pushes to its configured branch. Never merge `data` into
   `main`.
   **The repo used to have no `.github/workflows` at all, and that absence was
   the guarantee that a ledger push triggers nothing.** There are two workflows
   now, so that guarantee rests on their filters instead — read them before
   adding a third. `test.yml` is `branches: [main]` plus a paths filter (nothing
   under `src/` or `test/` ever changes on `data`, which carries one file), and
   it deliberately does **not** trigger on `index.html`, because `npm run
   deploy` commits that separately and re-running the suite on the build output
   would double every deploy for no new information. It also checks the
   committed `index.html` still matches what the sources build — the one thing a
   local deploy can skip by accident — via `check:build`, which compares the
   code and ignores the seed for the reasons above. A second step runs
   `check:seed`, which decodes the seed the committed page actually carries and
   refuses anything outside `SEED_KEEP`: the two together ask whether the page
   is this repo's code, and then what its data publishes.
   `backup-watchdog.yml` is the check the app cannot do for itself: it reads the
   `data` branch's own history on a daily schedule and opens an issue if nothing
   has landed in four days. **Its alarm has been seen to fire** — dispatched
   once with `threshold=0`, which opened issue #4, since verified and closed. A
   green run proves only that it stayed quiet; that input exists so the other
   half can be proven too, and both sides of the comparison go through
   `fromJSON` because step outputs are strings and a string/number compare that
   silently evaluates false is exactly how an alarm ends up never going off. The phone's "Backed up" line is only as honest as
   the phone — a device whose token expired, whose storage is unreadable, or
   that simply never gets opened has no way to tell you it stopped. This one
   cannot be fooled by anything happening on a device.
3. Create the photo repo: **`shivinate7/mailaudit-photos`, private, initialised
   with a README** so `main` exists — a Contents PUT into a repo with no commits
   is not a path worth relying on. Private is not optional: these are pictures
   of mailing labels with the delivery address on them.
4. Settings → Developer settings → Personal access tokens → **Fine-grained**.
   Name it per device (`mailday-iphone`) so one can be revoked alone. Only
   select repositories: **`mailaudit` AND `mailaudit-photos`** — one widened
   token covers both; an existing token can be edited rather than regenerated.
   Repository permissions: **Contents → Read and write** (Metadata → Read-only
   appears automatically and is required). Nothing else. **Fine-grained PATs cap at 366 days** — set a real expiry and a
   calendar reminder, because when it lapses the only symptom is a push that
   stops working.
5. In the app: Sync → paste → Save key → Push. Expect `Pushed ✓`, and check
   `main` gained no commit. With photos in the ledger, expect `mailaudit-photos`
   to gain one commit per photo (cosmetic — that repo serves nothing) and the
   button to stay on `Pushing…` until they are done, roughly a second each.

   Then the test worth actually doing: **pull onto a second device or origin**
   and confirm the thumbnails render. That is the one path where getting the
   order wrong is silent — the ledger would come back looking perfect with every
   photo id quietly stripped.

6. **Prove the merge before trusting auto-push**, because auto-push's conflict
   recovery is that same path running unattended. On A: check a card in, Push.
   On B *without pulling*: import a CSV that adds lines, Push — expect the
   conflict, then **Merge & push**. B must end holding A's check-in *and* its
   own new lines, and A's next Merge must agree. There is no toggle to turn on
   any more — sync is unconditional — so this proof is a prerequisite for
   running the app on two devices at all, not just for enabling something.

   `file://` and `http://localhost:4173` are two separate origins with two
   separate ledgers, so they stand in for two devices without needing a second
   phone — see "Running it locally".

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

`npm test` — 538 assertions, no test framework, ~60s (groups 30–31 spend a few
seconds in real timers, deliberately: the sweep race can only be reached by
letting the clock run). `test/app.test.mjs` runs
top to bottom and either prints "all green" or exits 1; `test/harness.mjs` holds
the jsdom setup, storage mocks, DOM helpers and the fixture.

It bundles `app.jsx` with esbuild (platform=node, format=cjs), boots it in jsdom
against mocked `window.storage` / `window.photos` / `window.versions` /
`window.remote`, and drives
it with real DOM events, asserting on rendered text. The app has no exports but
the component and that's fine — every behaviour worth protecting is one you can
see, so the assertions read the DOM the way the user does.

(Three previous harnesses were written ad hoc and thrown away, which is why the
same assertions kept being rewritten from scratch. Hence this one is committed
and `jsdom` is a real devDependency.)

New in group 42 (the save indicator's reserved slot). It is the smallest group
here and the one with the least it can prove, which is the point of writing
down what it is for: the defect is a **layout shift**, jsdom has no layout, and
no assertion in this suite will ever catch one. The measurement lives in
"The masthead"; what 42 pins is the mechanism underneath it, in each of the
places it can regress without looking wrong. 42.2 is the one that was got
wrong on the first attempt — reserving the slot's *width* while leaving it
empty, which fixes nothing, because an empty flex item is zero pixels *tall*
and a line holding only that item collapses. 42.3 is the one that keeps working
as the app changes: it drives the store into failure to reach the longest of
the three messages and asserts it fits the reserved width, counted in the `ch`
the reservation is written in — so lengthening that copy without widening the
slot turns the suite red rather than quietly reintroducing the shift. Nothing
here asserts the reservation's *size* is right; only a viewport can say that.

New in group 43 (the joy pass). It is deliberately **six assertions, not
sixty**: almost nothing about motion is assertable here — jsdom has no layout
and no compositor, so durations, easing, distances and the no-reflow claim were
settled by measuring a real 375px viewport instead, and a test that pretended
otherwise would be decoration. What is left is the two claims that are
*behaviour*, and both fail silently. 43.1–43.2 pin `data-view` on the switch,
which is now the only thing saying which segment is active — the buttons stopped
painting their own fill when the sliding thumb took it over, so losing the
attribute leaves the app with no active-view indicator at all while every button
still looks correct in a DOM dump. 43.3–43.6 pin the `useJustBecame` gate, and
**43.4 and 43.6 are a pair**: a mutant that classes the stamp on `done` alone
passes the first (completing a package does land the stamp) and dies on the
second (so does every finished order, on every re-render). Both confirmed to
turn the suite red. One fixture note worth keeping — the first draft checked the
package in under the default Showing, where a completed package correctly leaves
the list, so the element under assertion left the page; the group toggles to
Everything first.

New in group 44 (the card stops moving under the thumb). Same shape as 42, and
the same honest limit: the defect is a **layout shift**, jsdom has no layout,
and no assertion here will ever catch one — the numbers live in "The card's
reserved geometry" and were taken in a real viewport. What 44 pins is the
mechanism, in each place it can regress without looking wrong in a DOM dump: the
bar is out of flow (44.4a), cannot eat the header tap it now lies across
(44.4b), and both cards are containing blocks for it (44.2, 44.7) — without one
it draws somewhere else on the page entirely. The row's reservation exists
(44.3) and does not vary with the row's membership (44.4c) or with `done`
(44.6).

**44.5 is the one to keep if the group is ever trimmed**, and it is not really
a layout assertion at all: it says completing a package still *unmounts* the
bar. That gate is the whole reason the bar was taken out of flow instead of
being reserved a slot, because a slot has to stay mounted at 100% and the bar
would then sheen its own completion beside `.mdl-gild`. Read a 44.5 failure as
"someone changed the motion design", not as a broken refactor.

Eight mutants, all confirmed to turn the suite red, and note that three of them
needed a *pair* to die properly: the bar back in flow (44.4a); the bar allowed
to take pointer events (44.4b); either card losing `position: relative` (44.2,
44.7); the reservation dropped altogether (44.3); the bar surviving completion,
i.e. a reserved slot by another name (44.5); a reservation that varies by
membership (44.4c) — which 44.3 cannot catch, because a mutant that reserves
*something* different in each state still reserves something; and one that
varies only on the `done` branch (44.6), which 44.4c in turn cannot catch,
because it compares against a rest value the same mutant moved. Each of 44.3,
44.4c and 44.6 is alive only against the mutant the other two miss.

New in groups 38–41 (saved versions, and sync running itself).

Group 38 is pure, like 27, 31 and 33: it imports `version-rules.mjs` directly,
because a pruning bug deletes the one version the user was reaching for and
leaves a list that looks healthy. Group 39 drives the app and asserts on what a
milestone actually *holds* — the ledger as it was BEFORE the operation,
envelopes included. Group 40 is the resume merge, the behaviour in this app with
the least margin for error, because it applies a remote change with nobody
watching. Group 41 reads older versions off the branch's own history; the remote
mock records every push as a commit, which is not a convenience but the actual
claim the feature rests on.

`test/harness.mjs` mocks `window.versions` with a `Map` and prunes through the
**real** `prunePlan` — same reasoning as the remote mock encoding through the
real b64. It stores text uncompressed on purpose: gzip is the platform layer's
business, `app.jsx` never learns whether it happened, and jsdom has no
`CompressionStream`.

Mutation-tested, all confirmed to turn the suite red: the hourly tier deleted,
reaching forever, or treating every record as an anchor; the day anchor taking a
day's latest instead of its earliest; the recent ring keeping everything; day
anchors reaching forever; `dayKey` reading UTC; every save earning a version;
milestones never surviving; a version built from its own payload rather than
`snapshot()`; restore firing on one tap (local and remote); a restore bypassing
`applyBackup`; the History cell gated on `items.length`; Reset taking no
milestone or tidying the versions away; the resume handler reading the shared
`hiddenAt`; the threshold dropped to 0; the signal never consumed; an unknown
remote read as ahead; the mid-thought guard removed; `acceptPull` dropped from
`doMerge`; the quiet merge announcing itself; `freshSession` starting false; and
the load control fetching nothing.

Four method notes worth keeping, all learned the hard way here:

- **Group 38's own assertions have been wrong before the code was, four
  separate times, always the same way.** A tier's fixture must neutralise every
  *other* tier or the assertion is decided elsewhere: the day anchor keeps
  records the recent ring drops (the union working, not the ring failing), a
  small fixture never saturates the ring, and — the one that survived a mutation
  run — a record three hours old is also *today's earliest*, so it is kept by
  the day tier whether or not an hourly tier exists at all. Deleting the hourly
  tier left the suite green until the fixture gained an earlier record to take
  the day anchor off it. **When asserting that one tier keeps or drops
  something, make sure no other tier is quietly deciding it for you.**
- **38.9's first draft could not fail at all**: `dayKey("2026-05-01T00:30")` is
  `"2026-05-01"` under the UTC reading too. It derives the boundary from the
  runner's own `getTimezoneOffset()` now, and skips itself in UTC where there is
  nothing to claim.
- **An assertion that THROWS is a worse kill than one that fails.** Three of
  group 39's mutants died by `JSON.parse(null)` inside the test file, which
  aborts a top-to-bottom suite with no isolation and masks every group after it.
  Those reads are guarded now (`beforeReset && JSON.parse(...)`).
- **One mutant survived the first draft of group 40, and finding out why is the
  lesson.** "The signal is never consumed" passed all fifteen assertions,
  because every one ended with the two ends *in step*, where no further merge is
  possible and a flag left standing costs nothing. The state nothing reached:
  `check()` re-runs on every `syncBusy` flip, not only on visibility, so an
  unconsumed flag lets the other device's push land mid-session with no resume
  in sight. 40.12–40.13 pin it. **When a mutant survives, look for the state
  your fixtures never reach.** (Relatedly, group 41's first draft matched the
  older commit by `message.split(" ")[0]` — every push message starts with
  `ledger`, so it selected the newest row and restored the version the app
  already had. It passed and proved nothing.)

New in group 37 (order stamps). It drives the whole feature through the DOM —
the two entrances, the replace-not-stack rule, a refund leaving every count,
the stamped filter obeying Showing, Find and the range, the tombstone, the
five persistence sites — and then imports `mergeStamps` directly for the
merge rule and ends on group 34's shape with a removal on the other side.
Three of its assertions are the ones to keep if the group is ever trimmed:
37.34 (editing a note under a live search) is the only shape that catches
`stamps` missing from `visible`'s dep array, since a query change re-runs the
fresh closure anyway; 37.40 sorts a *refunded* package under Newest, because
under Oldest the `packageOrder`-from-`packages` mutant coincidentally produces
the right order; and 37.62 asserts `merged.stamps` deep-equals `{}` rather
than merely truthy, because `undefined` is exactly what the builder produces
when it forgets the key.

New in group 36 (the action row). Four claims, all behaviour rather than
layout, because jsdom has none and the layout is what the row exists for: an
armed Reset takes the row and the other two cells step out (36.1–36.4, and
the open Sync panel underneath stays put); an odd cell count in the Sync grid
spans its last cell (36.5–36.7 — the first draft booted against a seeded
remote, which makes this device *behind*, adds a Merge cell, and turns three
into four: read the count off the screen, not off the fixture); and the token
field is 16px (36.8), which is the one style assertion in the suite, kept
because it pins an iOS behaviour — focusing anything smaller zooms the page —
and not a look. Confirmed to turn the suite red: the row keeping its other
cells while Reset is armed, and the span dropped.

New in group 35 (a pull that didn't land must not license a push). The whole
group exists because the suite was green, the merge logic was provably correct
against the user's real ledgers, and the feature still destroyed data on day
one — because nothing asserted on what the *sha* did when an apply failed. When
a sync bug is reported, check what the sha did, not just what the merge
computed.

New in groups 33–34 (two-device merge and auto-push). Group 33 is pure, like 27
and 31: it imports `merge-rules.mjs` directly, because a merge that drops lines
produces a plausible ledger rather than an error. The assertions worth keeping
are the *symmetry* ones — merging A into B and B into A must yield the same
counts, and merging twice must add nothing — since those are what say "this
cannot pick a loser" and "a retry after a half-failed sync is harmless".

Group 34 drives the app. Its fixture is the real 08-22 state from
`git log origin/data`: a phone holding unpushed check-ins and a stale item list
against a remote carrying the laptop's fresh import.

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

That gap has a cost worth naming, because it was paid: the `pushForce` sha bug
lived in `entry.jsx`, so **no app-level test could catch it, and none can catch
its return.** Restoring the bad ordering leaves the suite green — verified. What
the suite pins instead is the *mock's* faithfulness (35.6–35.7), which is only
as good as the mock. When a rule matters and lives below this seam, the mock is
the test, so keep it honest: this one had mirrored the bug and disabled the only
failure that could expose it.

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
- Push, Pull and Merge are the repair kit, whose only entrance is the
  broken-line, so `openSync()` clicks `/tap to/` rather than a `Sync` cell.
  Backup moved to History, so `openHistory()` is its counterpart. Both
  idempotent; just call them. `openSync()` works because every fresh fixture
  starts with no key, which *is* a broken state.
- **`boot()` seeds `opts.remote` AFTER the mount and then glances at the page**
  (a `foreground()` with the away-clock untouched). That is what almost every
  fixture actually means — the other device pushed at some point since — and it
  had to change when resumes began merging, because a cold mount counts as a
  fresh session and a remote seeded *before* the mount would auto-merge away the
  very conflict the fixture was written to produce. `opts.remoteAtBoot` is the
  explicit before-mount form, for the cold-start assertions in group 40. One
  harness change, no call sites touched, and a more faithful model of the wire.
- The `Pushed ✓` flash now starts **after** the photo phase, not after the
  ledger leg — showing it while a dozen uploads are queued is a lie, and it
  re-enabled the button into a second concurrent loop. So a test that pushes
  twice must match `/^Push(ed ✓)?$/`, and both buttons are disabled on
  `syncBusy` for the whole operation rather than on `pushState`/`pullState`.
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
- **jsdom implements no scrolling**, so `scrollIntoView` simply isn't there and
  calling it throws. `harness.mjs` stubs it. There is no layout to move, so
  where the page ends up is not assertable here — group 32's jump asserts on
  *what renders* instead, which is the part that can actually be wrong.
- A successful push shows `Pushed ✓` for 2.5s, so `btn(/^Push$/)` won't match
  during the flash. Assert on state, or wait it out.
- **Auto-push's 90s idle debounce is not something to wait out.** Drive it with
  `background()` instead, which dispatches `visibilitychange` with
  `visibilityState` stubbed to `hidden` — the handler calls `autoPush()`
  immediately. That is a fast seam *and* a real path (switching away mid-mail-day
  is the last chance to catch a session that never went idle), so the test isn't
  reaching for a private hook. `foreground()` is the inverse and is also what
  re-runs the `peek`.
- `backgroundFor(ms)` is that pair with `Date.now` frozen across it, for the
  resume reset on Showing — the elapsed time is the argument rather than the
  wall clock, since the threshold is 60s and no test can wait it out. It is
  deliberately not a remount: on iOS a resume isn't one, and that is the whole
  distinction the reset exists to handle. Note all three visibility listeners
  read `document.visibilityState`, never `document.hidden`, so stubbing the
  one is enough.
  A test that merely waits ~200ms and asserts nothing was pushed proves nothing,
  because the debounce is 90s — that assertion cannot fail. The first draft of
  34.18 was exactly that shape; watch for it.
- **`background()` restores `visibilityState` to visible when it returns.** It
  did not at first, and a hidden document makes the foreground peek return
  early — so the Merge button never appears and an unrelated later test fails
  looking for it. The symptom points nowhere near the cause.
- **`remote.fail` cannot express "the push conflicts".** It rejects the pull as
  well, so the merge that recovers from the conflict never gets its payload.
  `remote.pushFailOnce` is the one-shot, push-only version, and it models the
  real race: the remote moves between the `peek` and the `PUT`.

New in groups 30–31 (photo sync). `harness.mjs` grows a remote photo store
alongside the ledger mock, with three choices worth keeping:

- It encodes through the **real** `blobToBase64`, so an app-level push→pull
  round trip exercises the actual codec — 30.7 asserts the bytes come back
  identical, and swapping the encoder for the text one turns it red.
- **`listPhotos` refuses to answer without a key**, because the photo repo is
  private and GitHub hides a private repo behind a 404. Modelling it as readable
  keylessly would make the suite blind to the entire `no-access` bug class — and
  in fact it did: this is what forced 26.13 to split.
- `remote.photoDelay` makes a download slow, which is the only way to put the
  2s sweep between two arriving photos (30.16).

The sweep is protected by **two** guards — `syncBusy` in the effect's condition
and `syncingRef.current` inside the timeout callback — and they are genuinely
redundant: removing either alone leaves 30.16 green, removing both turns it red.
That is deliberate (the ref is set synchronously; the state behind it commits on
React's schedule, which jsdom will not reliably reproduce), but it does mean no
test pins either one individually. Don't read a surviving single mutant here as
dead code.

One bug this exercise actually caught, worth keeping as a cautionary tale: the
pull's "these photos are about to be gone" warning was measured off
`plan.toPush`, which is keyed on the **incoming** ledger's ids — precisely the
set that survives a pull untouched. It fired when photos were safe and stayed
silent when they were genuinely destroyed. It is now measured against what the
replace actually drops (referenced here, absent from the incoming copy, absent
from the remote). Tests 30.18–30.20 pin both directions, because the first
version got both of them backwards.

Mutation-tested, all confirmed to turn the suite red: a pull applying the backup
*before* downloading (ids stripped); photo bytes through the text encoder; a
push that doesn't subtract what is already remote; an unreadable store read as
empty; both sweep guards removed; and — the most valuable assertion in the
feature — **a photo error escaping into the ledger's error path**, which makes
`Push anyway` appear and would let a slow upload arm a button that overwrites
another device's ledger (30.11).

Group 35 added three, all confirmed to turn the suite red: the adapter
advancing the sha inside `pull()` again; `doMerge` never accepting it; and
`doPull` never accepting it.

Group 37 (order stamps) added **nine**, all confirmed to turn the suite red:
`mergeLedger` not naming `stamps` (37.62–37.68); `snapshot()` dropping them
(25.10, 37.51, 37.68); `canceledCount` measured off `liveItems` instead of
`activeItems` (37.18); `packageOrder` built from `packages` rather than the
live source (37.40); removal as a `delete` rather than a tombstone (37.45);
`mergeStamps` letting the incoming copy take a tie (37.55); `stamps` missing
from `visible`'s deps (37.34); the refund exclusion dropped from `liveItems`
(37.70); and the warning ignoring the stamp (37.11).
That seventh one is the cautionary tale of this group: with the exclusion
dropped from `liveItems` alone, **every masthead figure still came out right**
— they derive from `rangedItems`, which excludes refunds on its own — and the
first draft of the group, all counts and lists, let the mutant live. Only the
Orphaned candidates read `liveItems`, so only an envelope test could see it.
When a chokepoint has two branches, assert on both.

Groups 33–34 (two-device merge and auto-push) added **twelve**, all confirmed
to turn the suite red: `mergeReceived` using incoming-wins instead of `max`;
`mergeItems` replacing instead of unioning; the envelope collision preferring
the bigger copy; `mergeLedger` letting the remote's view preferences win; a
merge applying the ledger *before* downloading photos; auto-push reading an
unreadable remote as all clear; auto-push leaving a conflict rather than
merging; a merge that stops disarming the other confirms; assignment no longer
stamping `updatedAt`; the photo phase surveying the pre-merge reference list;
`doMerge` not re-adopting the generation `applyBackup` bumps; and a conflict
during the merged push leaving no button.

Three of those are worth remembering as method, because the first drafts of
these tests were all wrong in ways that looked fine:

- **34.10 asserted `saved().items === undefined ? 0 : 1`** — which is 1 whether
  the ledger survived or was wiped. Tightening it to a real count immediately
  showed the test was *also* reading before the 500ms debounce had written.
  Two bugs behind one assertion that could not fail.
- **The photo-ordering mutant was "caught" for the wrong reason.** It failed
  34.7 (the merged ledger reaching GitHub) because moving the code also tripped
  the generation guard — nothing was asserting about photos at all. It only
  became a real test once 34.31 put the blob **exclusively on the remote**; with
  a local copy the id is in `present` anyway and the assertion passes under the
  mutation. When a mutant dies, check it died of the right thing.
- **`doMerge` genuinely was broken**, and only 34.29 found it: `applyBackup`
  increments `syncGen` so that work in flight against the pre-restore world
  can't land. `doPull` never noticed because applying is the last thing it does.
  A merge *pushes* afterwards, so every gen-guarded step after the apply — the
  whole photo phase, and the `Pushed ✓` flash — silently did nothing.

Group 12's Showing assertions added five, all confirmed to turn the suite red:
the default flipped back to Everything; the choice surviving a remount (a
module-level cache, standing in for anyone who "helpfully" persists it), which
kills 12.7 while leaving 12.4 green, so the pair isolates the reload from the
default; the threshold dropped, so a five-second glance away resets the list;
the resume never resetting; and the hidden branch not stamping the clock. That
last pair is why 12.8 and 12.9 both exist — either one alone leaves half the
threshold unpinned.

Group 32 (getting from a search hit to the whole order) added four, all
confirmed to turn the suite red: the order-id button losing its
`stopPropagation`, which turns a look into a check-in; `revealed` missing from
`visible`'s dep array, so the reveal renders one commit late or never; the
reveal-clearing effect also keyed on `view`, which wipes the reveal the Tally
jump just set and lands you on a still-filtered card; and a reveal that
bypasses the query but not `hideDone`, which quietly shows less than "the whole
order" and strands the jump on a fully-received package.

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
seller names, through a real CSV import; Showing starting on Unreceived and
not surviving a reload, and both sides of the resume threshold (a glance away
keeps your choice, a real absence starts fresh); getting from a search hit to the whole
order (per-package reveal, the Tally jump, the search surviving it, the hideDone
bypass, and a navigation tap writing nothing); the two-device merge (both
devices' work surviving a conflict, symmetry, idempotence, view preferences
staying local, an assigned-away envelope not resurrecting, and the merged
ledger reaching GitHub); auto-push (looking before it writes, refusing on an
unreadable *or* an ahead remote, merging rather than forcing when a conflict
opens mid-write, and the toggle living outside the ledger); the mechanism under
a package card that does not change height on a check-in (the bar out of flow
and unable to take a tap, both cards being containing blocks for it, the bar
still unmounting on completion, and the action row's reservation not varying
with its membership); and the older package/Tally views still working.

Still only covered by eye, never by a test: anything that needs a real device —
the camera capture, the canvas downscale, iOS keyboard behaviour, and whether
iOS actually fires `visibilitychange` when a home-screen app is resumed (the
suite dispatches the event itself, so it pins the reaction and not the trigger). Layout at
375px is no longer eyeball-only: it was measured in a real 375px viewport
(overflow 0, thirds 114px each, seal 36px, 0.00px row displacement when the
running head pins, and a package card constant at 347.09px with 0.00px row
displacement across a whole check-in), though those numbers are not asserted in
CI.

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
real response. Since then the `data` branch has taken **real authenticated
pushes** (`git log origin/data` shows them), so that gap is closed for the
ledger. Photo sync has had its read paths verified live and keylessly — the raw
media type returns bytes with `access-control-allow-origin: *`, a directory
listing returns `{name,type,size,sha}`, a missing directory returns 404 "Not
Found" (so `missing`, distinct from `no-branch`), and a keyless request to the
private `mailaudit-photos` 404s on both the tree and the repo, which is the
`no-access` path.

**The ledger repo's own private path is now verified live too** — the first
real-GitHub confirmation of anything on the read side since the repo was closed.
From the deployed Pages origin with no key, `pull()`, `listVersions()` and
`peek()` all return `no-access`, and `peek()` answers `{known: false}` rather
than "nobody is ahead", which is the reading that would otherwise let a keyless
device push straight over the one that can see. Measured at the same time: the
site still serves **200** to an anonymous request while
`raw.githubusercontent.com/.../data/ledger.json` and the repo API both **404**.
That is the whole point of the private/Pro arrangement, confirmed rather than
assumed. So `peek()` comes off the unverified list.

**Still never run against real GitHub: an authenticated photo PUT, a photo pull
that returns bytes, and a ledger conflict.**

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
- **The ledger repo is PRIVATE.** It was world-readable — `ledger.json` served
  at a permanent `raw.githubusercontent.com` URL to anyone, logged out, carrying
  order ids, sellers, prices, dates and any tracking numbers or sender names
  typed into envelope notes. GitHub Pro serves Pages from a private repo, so
  closing it cost one setting rather than the `mailaudit-data` migration this
  entry used to describe. The **site** is still public (Pages access control is
  Enterprise-only, and is not wanted here) — the app loads for anyone; the data
  does not.
  The price, which was always the price: **keyless pull is gone.** A fresh
  device can no longer recover before it has been set up, and every device needs
  the token pasted. And GitHub hides a repo you cannot see behind a **404**, so
  every ledger read now has to disambiguate that or a keyless device is told
  "no ledger has been pushed yet" about a ledger sitting safely on a branch it
  simply cannot read — an invitation to push over it. `classifyLedger` does one
  extra `GET /repos/{owner}/{repo}` on the 404 path only; `pull`, `peek`,
  `listVersions` and `getVersion` all route through it, and `no-access` is a
  `syncBroken` case with its own line. Group 38c. This is the same shape
  `listPhotos` has always had, inherited by the ledger the day it went private.
- **The token expires.** Fine-grained PATs cap at 366 days. When it lapses the
  app 401s and says "expired or been revoked" — but nothing warns beforehand,
  and the only symptom is a push that stops working.
- **The token sits on a shared origin.** `shivinate7.github.io` is one origin
  across every Pages repo, so script from any other project there can read
  `mailday-remote:v1`. Mitigated by the fine-grained, single-repo,
  Contents-only scope and one token per device — not eliminated.
- **Auto-apply happens now, and why the answer changed is worth recording.**
  This entry used to say the app never applies a remote change on its own. The
  objection was never "applying is unsafe" — it was that *the app could not tell
  mid-check-in from between-sessions*, and merging forty new CSV lines into the
  package list under a thumb is the cascading mis-tap invariant 5 exists to
  prevent. `RESUME_RESET_MS` **is** that discrimination, and the app already
  trusts it with a list reshape when it resets Showing. So the merge now spends
  the same finding. What has *not* changed: it never applies on a timer, never
  mid-thought (the five guards), and never on a remote it could not read.
  Auto-push's `ahead` branch stayed a **refusal** on purpose — the 90s debounce
  measures *data* idleness, not the user's, so it fires exactly when someone is
  reading the screen with a reveal open, and it is the one thing stopping a
  device writing over a remote it is behind (34.19).
- **`max` on `received` cannot express an un-check.** "Clear check-ins", or
  stepping a qty back to 0, racing the other device's stale copy means the card
  comes back checked. Visible and one tap to fix, and the alternative is a
  per-key `receivedAt` schema change bought for a case a phone-only-checks-in
  workflow barely produces. It stays available: `receivedAt` would be an
  additive optional key and `mergeReceived` is the one function to change.
- **Envelope deletion isn't represented, so a discarded envelope can come
  back.** Nothing distinguishes "deleted here" from "created there" without
  tombstones. The bias is chosen: entries are hand-typed and exist nowhere else,
  and invariant 7 means a stray envelope decides nothing on its own —
  resurrecting one costs a tap, dropping one costs data the user typed.
  **Stamps go the other way, deliberately:** a removed stamp is a tombstone
  (`kind: ""`), because a resurrected `refunded` stamp would silently take
  money back out of the tally, and a stamp is one value the user can re-set in
  two taps. Tombstones and stamps orphaned by a changed seller string are
  never pruned; both are a few bytes.
- **Photos in git are permanent, including discarded ones.** Nothing ever
  deletes a remote photo: Discard, the sweep and `resetAll` all stop at the
  device boundary, and git history would keep the blob even if the tip didn't.
  So a label from an envelope you discarded stays in the private repo forever.
  A `DELETE` path is easy to add but costs a fourth content-generating request
  class and a new destructive control; being honest about it is the better
  trade. The upside of the same fact: **Reset is now survivable for photos** —
  `resetAll` keeps the token and sha, so a Pull brings ledger and photos back.
- **The 500-content-requests/hour cap is shared with the ledger push.** A
  first-ever backfill of several hundred photos cannot finish inside an hour.
  Hence `PHOTO_BATCH` (25 per tap) and the resumable set difference; the loop
  also stops rather than grinds on a 403/429, per GitHub's own guidance.
- **The token now spans two repos.** One widened fine-grained PAT covers
  `mailaudit` and `mailaudit-photos`. That is one more private repo inside the
  blast radius of the shared-origin risk noted above — the mitigation is still
  the single-purpose Contents-only scope and one token per device, and the
  alternative (a second, separate token) was considered and declined for the
  paste-per-device cost.
- **Nothing recovers without the key any more.** This entry used to say the
  ledger half was keyless and only photos needed the token. Both need it now
  that the ledger repo is private, so a fresh device must be set up before it
  can recover rather than after — the one real cost of closing the public
  ledger. Everything unreachable must read as *"needs your key"* and never as
  lost or as absent, which is why `listPhotos` and `peek` are three-valued and
  why `classifyLedger` disambiguates the 404.
- **The conflict guard has never been verified against real GitHub**, and it is
  now the thing most worth verifying, because `Merge & push` and auto-push both
  hang off it. The ledger repo *has* taken real authenticated pushes
  (`git log origin/data`), so the transport works; what is unproven is the 409
  itself. Verify it deliberately: push from device A, then push from B *without*
  pulling. B must be blocked. If B succeeds, the sha bookkeeping is wrong and
  A's data was just overwritten — recover with `git show data~1:ledger.json`
  and restore that file the normal way.
  Then take the same setup one step further, which is the new path: on B tap
  **Merge & push**, and confirm B ends holding *both* devices' work and A's next
  Pull agrees. Do this **before turning auto-push on**, because auto-push's
  conflict recovery is exactly this path running unattended.
- **`peek()` has now run against real GitHub, but only its refusal path.** From
  the deployed origin with no key it returns `{known: false, reason:
  "no-access"}` against the private repo, which is the branch that matters most
  — read the other way, a keyless device would push over the one that can see.
  What is still unverified is the *successful* path: that a keyed, fresh device
  with no local sha reports `ahead` rather than erroring, since that is the
  state every new phone starts in. Still never run for real: an authenticated
  photo PUT, a photo pull that returns bytes, and a ledger conflict.
