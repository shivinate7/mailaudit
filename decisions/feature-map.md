# What each view and control does

This file holds the Feature map. It describes the three views, saved
versions and stamps, and how Push, Pull and the sync panel behave. Read it
when you need to know what a screen or control does, not why it was built
that way. The rulings behind these features live in other decisions/ files
and in invariants/. This file is description only.

## What is verified and what is not

```

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
```

## The Tally view's sort and unit rate

```
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
```

## Orphaned mail and envelope photos

```
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
```

## Getting from a search hit back to the whole order

```
  set of package `gk`s that ignore the filters and render the whole order, with
  two entrances. In **Packages**, a filtered card carries a footer
  — `+4 more lines in this order · show all` — which reveals *that* package
  and leaves the other results filtered, so near-duplicate candidates can be
  compared side by side. In **Tally**, each source copy's order id is the
  control (underlined, with a `›`): it reveals that order, switches to
  Packages and scrolls to it, **leaving the search untouched** so one tap on
  the view switch comes straight back.

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
```

## Canceled and refunded orders

```
- Canceled orders: excluded from list and all counts; viewable via
  "N canceled — view" link which scrolls to a dashed reference section (for
  refund auditing). Tracked/untracked shown as ●/○ dot + word in header meta.
  **Refunded and partial-refund stamped packages leave the same way** — see
  the next bullet.
```

## Order stamps

```
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
```

## Saved versions and backups

```
- **Saved versions, and a History list to roll back from.** Gzipped snapshots
  in their own IndexedDB store, listed newest first —
  `14:32 · before import · 806/481` — expanding to the delta against now and a

  Two consequences worth protecting. `resetAll` deliberately does **not** clear
  versions, which is what makes an accidental Reset recoverable rather than
  final. And a restore takes its own `before restore` milestone on the way in,
  so tapping the wrong row is survivable rather than a second disaster.

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
```

## Photo ids on restore

```
  The third arm (`extraPresent`) came with photo sync and matters in two places
  a narrower rule would lose data: one GET failing out of twelve would strip
  that one id, the debounced save would write the stripped ledger and the next
  push would publish it — severing the link to a photo sitting safe on GitHub
  that a retry would have fetched; and when the photo repo can't be reached at
  all, every id would go at once. **Keeping an id costs a blank manila tile
  until the next pull. Stripping it costs the photo.** So 26.13 split: strip
  only when the store was actually *read* and genuinely didn't hold it (26.13),
  keep when we couldn't look (26.13b).
```

## Accepting a pull's bytes before its sha

```

  It happened on the first day of real two-device use and cost a check-in.
  `git log origin/data` has the receipt: `87793de` is **byte-identical to
  `38017ae`, six days older**, landing on top of a newer ledger with no
  conflict. Diff the blobs, not just the counts — identical blobs are how you
  tell which device wrote what.

  Failing to accept leaves the device merely *behind*, which conflicts loudly on
  the next push. That is the direction this must fail in. Group 35.
```

## Merge ordering

```
  The ordering inside it is the same one `doPull` depends on — **photos are
  fetched before the ledger is applied** — and for a sharper reason: the merge
  unions both devices' envelopes, so ids arriving from the other device have no
  blob here yet and `applyBackup` would strip every one of them.
```

## peek() and auto-push

```
  **The same `peek` is now also the auto-merge's trigger**, which is why it is
  one read and not two, and why the merge sits inside its `known` branch. The
  foreground call does three things at once: reports whether the remote is
  ahead, licenses or refuses the merge, and — via `freshSession` — decides
  whether this foreground was a new session at all.
- **Push / Pull (GitHub).** Automatic backup to `ledger.json` on the
  **`data` branch** of `shivinate7/mailaudit-data` — the private repo, which
  also holds the photos on its `main`. It used to be `mailaudit`'s own `data`
  branch, and that is why `mailaudit` had to stay private; moving it out is what
  let the source repo go public. The branch survives the move for a NEW reason —
  `listVersions` reads `commits?path=ledger.json&sha=data`, so that log is the
  version archive and photo commits must stay off it. The old reason (Pages
```

## Photos on their own branch

```
  **Photos share the repo with the ledger, on their own branch.**
  `shivinate7/mailaudit-data`, **private**, branch `main`, one file per photo at
  `photos/<id>.<ext>`.
  They used to be two repos, and the argument for that is worth knowing because
  it is *retired*, not forgotten. Privacy was the whole of it: a mailing label
  carries a delivery address and the ledger repo was public. That died when the
  ledger repo went private, and the merge happened when `mailaudit` went public
  and the ledger had to leave it regardless. What the merge buys is **one repo
  in the token's blast radius instead of two** — `shivinate7.github.io` is a
  single origin across every Pages project, so the mitigation for a readable
  token is the fine-grained, Contents-only, now genuinely *single*-repo scope.

  Of the two reasons that once survived the privacy argument, one applied only
  to the opposite merge and one is now **paid in code**:

  - "Git is permanent while the app repo is the one you clone" argued against
    photos landing in `mailaudit`. The ledger moved *into* the photo repo, so
    `mailaudit` got smaller, not bigger. It never applied to this direction.
  - "**GitHub's 409 on rapid successive Contents writes is per-repo**" is real
    and still true, and it is why `push()` now `await`s `spaceWrites()` — the
    same 1s clock `pushPhoto` has always used. Before the merge the ledger PUT
    could skip it because it was the only write its repo ever saw, and app.jsx
    pushes the ledger then immediately loops photo uploads. **Remove that call
    and the first photo of every push 409s.** The separate error tables still
    matter for the same reason they always did: a throttled photo must never
    reach `pushState`, because `pushState === "conflict"` is the only gate on
    Push anyway.

  Push and Pull each do both legs in one tap — ledger first, photos after.



  Three things that are load-bearing and non-obvious:

```

## The ruled head

```

### The ruled head

```

## The action row and its disclosures

```
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
```

## Panels close each other

```

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

```

## Detecting a stalled sync

```

**`ahead` is one of its cases, and leaving it out was the worst hole the silent
sync opened.** Auto-push declines while the remote is ahead, and the auto-merge
only fires on a *fresh session* — so a device that goes behind mid-session stops
backing up entirely, for the rest of that session. The manila "pushed newer
lines" advisory still exists but lives *inside* the panel, whose only entrance
is this line, so it could only be found by someone who already knew to look. And
the 24h staleness backstop could not rescue it: `syncBroken` is a `useMemo` that
reads `Date.now()`, and a stalled device changes none of its deps, so that
comparison is frozen too. Tests 38b.1–38b.3.

```

## The sync panel's contents

```

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

```

## See also

- `card-tally-row-counts-first` — why the Tally row orders its meta line the way it does.
- `unit-rate-is-not-the-position` — the figure the Tally sort calls "unit rate".
- `cost-basis-excludes-shipping-and-tax` — what basis counts and what it leaves out.
- `orphaned-mail-never-decides` — the invariant Orphaned's ranking must never cross.
- `stamp-removal-writes-a-tombstone` — how a removed stamp survives a merge.
- `one-stamp-per-package` — why picking a new stamp kind replaces, not stacks.
- `versions-get-their-own-database` — why saved versions live outside the photo store.
- `milestones-are-taken-before-the-risk` — when a milestone version is taken.
- `sha-accepted-only-after-apply` — the rule the sync panel's Push/Pull rest on.
- `peek-is-three-valued` — what peek() answers and why unknown is not clear.
- `one-repo-for-both-halves` — why the ledger and photos share one repo now.
- `photo-sync-cannot-conflict` — why photo sync needs no sha at all.
