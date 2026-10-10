# What each view and control does

This file holds the Feature map. It describes the three views, saved versions and stamps, and how Push, Pull and the sync panel behave. Read it when you need to know what a screen or control does, not why it was built that way. The rulings behind these features live in other decisions/ files and in invariants/. This file is description only.

**Holds while:** `src/app.jsx` still labels the three views Orphaned, Tally and Packages. The `invariants/` and `decisions/` folders still hold the rulings this file cites.

## What is verified and what is not

Everything here is user-verified in daily use, except these items. They are the **Tally** view, cost basis, **Orphaned**, **envelope photos**, **Push / Pull**, the **two-device merge and auto-push**, and the **resume reset on Showing**. They are newer. So far they are verified only by `npm test`.

Auto-push is the one item here with a *field* record, and it is a bad one. Its first day of real two-device use destroyed a check-in. The merge was not wrong. Replayed against the two real ledgers, it is correct. The cause was that the adapter advanced the stored sha before the app had applied the bytes. That let a stale ledger push with no conflict. Group 35 fixes this and pins it. The sha rule is written out at length under Push / Pull.

Treat the rest of this list as genuinely unproven, not merely untested. The camera path in particular has never run on a real iPhone, and neither has the resume reset. jsdom can prove that the listener is wired and the arithmetic is right. Whether iOS fires `visibilitychange` on a home-screen app's return is WebKit's call.

Real requests have reached GitHub. The data branch has taken real authenticated pushes, and the keyless refusal path has run from the deployed page. The push and pull paths are still covered by the harness mock and by hand against the built page. The photo PUT, the photo pull that returns bytes, and the ledger conflict have never run against real GitHub. See "Known open threads" for exactly what that leaves unproven.

## Feature map (all implemented)

- Three views sit behind an Orphaned / Tally / Packages switch at the top. The first two share one `received` map, the date filter, search, and Showing (the old Hide received). Orphaned hides all of those, because they apply to nothing there. It keeps Re-import / Backup / Reset reachable. The switch survives an empty ledger, so pending envelopes cannot be stranded. It carries a count badge while envelopes are waiting.

## The Tally view's sort and unit rate

Each Tally row shows `got/ordered`, the **unit rate** ("$X / copy"), "N left · $Y", seller/order counts, and the sets involved. Expanding a row adds a "$X across N copies · $Y avg" line. It lists every source copy (seller, date, set, order id). Each copy has the same tap-to-check and qty stepper as the package view. Each copy also has per-copy lost-mail flags.

Counts and basis always cover every copy of the item. This holds even when Hide received or search filters the breakdown. A "N copies hidden by filters" note says so.

Sort options: most missing / biggest position / most ordered / $ remaining / **unit rate** / name A–Z. The order is frozen while checking, and it persists as `itemSort`.

Unit rate is `basis / qty`. It is the same figure the expanded row shows as "$Y avg". It deliberately disagrees with "biggest position". A cheap card bought in bulk has a large position and a small rate.

## Orphaned mail and envelope photos

- **Orphaned**: for packages that arrive with no way to tell who sent them. *Record an envelope* → one autofocused input. Suggestions are drawn from cards still outstanding (`outstandingNames`). A tap adds the card, and a second tap bumps the qty. The input clears and keeps focus, so the iOS keyboard never dips. The return key, or an "Add … as typed" row, records anything not in the ledger. An optional note (tracking #, sender) and optional photos are available. Neither blocks the fast path. Saved envelopes sit in a pile, newest first. They touch nothing in the ledger.
- Each pending envelope lists the outstanding packages that could explain it (`rankCandidates`), best first, with how much each explains. A two-tap confirm checks in *exactly the recorded cards* and nothing else. Unexplained entries are tagged "no outstanding copy". They stay behind in a smaller envelope that keeps its id, createdAt and note. Each envelope has Edit and a two-tap Discard. The last assignment is undoable. Its notice is rendered at the vacated slot in the pile, not at the top of the page.
- Name matching goes through `normName` (NFD-strip accents, lowercase, collapse non-alphanumerics). This is required, because iOS smart punctuation turns a typed `'` into `’`. The CSV uses a straight apostrophe, so the names would never match without it.
- Candidates ignore the date filter on purpose, because an orphaned envelope is as likely to be an old order. Candidates also exclude canceled orders. They are derived, never stored. So a package received by other means simply stops being offered.
- See `orphaned-mail-never-decides` for what this must never do.
- **Envelope photos** (a snap of the mailing label, so a tracking number or sender survives without typing it). `<input capture="environment">` opens the iOS camera directly. The image is canvas-downscaled to a 2000px long edge at JPEG 0.8. That is big enough to *read* a label and small enough not to matter. It is written straight to IndexedDB. Envelopes carry only photo ids. Thumbnails sit on the card, and tapping one opens a full-screen viewer.
- Nothing deletes photos implicitly. So a single **sweep** effect covers every orphan path at once: discard, assign-away, restore, and a cancelled composer. It drops any blob that no envelope references. It is held off while an undo is live or a composer is open, because either can bring ids back. A "N photos stored · X of Y used on this device" line in the pile reports real `navigator.storage.estimate()` numbers.
- CSV import works by drag and drop or by picker. It uses merge semantics and shows an import summary notice.
- Packages are grouped by orderId+seller. They expand and collapse. Each package has a per-package progress bar. The bar appears only for a package that is partly complete. It is drawn as a 3px rule on the card's top edge, not as a row inside it. See "The card's reserved geometry". Contextual "Mark all received" and "Clear check-ins" sit in a row held at a reserved height, for the same reason. A rotated RECEIVED stamp replaces the count badge once the package is complete.
- A whole-row tap toggles a row. Names wrap to 2 lines. A qty stepper appears for qty>1, with an indeterminate-dash partial state.
- Search covers card, set, seller, and order. Showing (the old "Hide received") now starts on Unreceived every session. See the ruled head. The date filters are All, 30, 45, 60, and 90, a free "# days" input, and a custom from–to range. The search and date filters are shared by the two ledger views. They are hidden entirely under Orphaned.

## Getting from a search hit back to the whole order

A search filters inside a package. So every result needs a way back to its whole order. `revealed` is a set of package `gk`s. These ignore the filters and render the whole order. It has two entrances.

- In **Packages**, a filtered card carries a footer: `+4 more lines in this order · show all`. It reveals *that* package. It leaves the other results filtered, so near-duplicate candidates can be compared side by side.
- In **Tally**, each source copy's order id is the control. It is underlined, with a `›`. It reveals that order, switches to Packages, and scrolls to it. It leaves the search untouched, so one tap on the view switch comes straight back.

`revealed` is ephemeral UI state, never persisted. So the five-site rule in `saved-state-shape` does not apply to it. Group 32.

Package sort (newest/oldest/$ remaining/unit rate/seller A–Z) is separate from `itemSort`. The control swaps with the view. Both orders are frozen while checking.

**Unit rate** means different things in each view. Both meanings are implemented. In Tally it is `g.avg`, the group's basis over its copies. For a package it is that package's basis over its own copies. It is computed in `packageOrder`.

The **date range is collapsed behind one control** that shows the active range. Tapping it reveals the chip set, the free "# days" box, and the custom from–to pair. It starts shut on every load and is not persisted. It is a disclosure, not a preference. Collapsing it saved ~22px. Seven chips wrapped to two rows at 375px. Custom from–to always claimed a third row, because native `<input type="date">` carries a ~140px UA minimum width.

- Outstanding value: overall "$X still missing", and per-package and per-item "N left · $Y".

## Canceled and refunded orders

- Canceled orders are excluded from the list and from all counts. They are viewable through an "N canceled — view" link. The link scrolls to a dashed reference section, for refund auditing. Tracked and untracked orders are shown as a ●/○ dot plus a word in the header meta.
- **Refunded and partial-refund stamped packages leave the same way.** See the next section.

## Order stamps

The stamp is rendered as a band under the package header. The band is a rotated chip in the RECEIVED stamp's construction. It is manila rather than green, and it carries the note in Cochin italic. It stays visible while the package is collapsed.

There are two entrances and one editor. The first stamp comes from a `Stamp` button. That button sits first in the expanded card's action row. Once a stamp exists, the button goes away, and **the band itself is the control**. It shows a trailing `›`, like the Tally order-id link.

The editor offers the six kinds as option cells, in the month picker's treatment. `Other` comes last, for anything the fixed five do not name. The free line carries the detail. The editor also has the note field (16px, or iOS zooms), a two-tap *Remove stamp*, Cancel, and Save.

Stamping an order Refunded makes its card vanish from the list under the finger. The precedent is "Mark all received" under Unreceived. The `N stamped` cell is the signpost. That cell sits beside `N canceled` in the Find row. It is a **filter on top of the normal pipeline**. The date range, Showing, and Find all still apply. So a stamped, fully received package stays hidden under Unreceived. The count can read higher than the list, exactly as `N lines` can.

Refunded packages are sourced back in while the filter is on. `stampedPackages` comes from `rangedActive`, the in-range items *before* the refund exclusion. Each one shows a manila `N left · refunded` pill in place of the red figure. This is the only place a refund can be found and un-stamped. `packageOrder` ranks whichever source is live. Without that, a refunded package would sit last under every sort. This filter works in the Packages view only. Tally has no package to filter.

The stamp's label and note are in the Packages search haystack. A package-level hit keeps **every** line. Filtering them would draw exactly the one-line-order lie that group 32 exists to undo.

## Saved versions and backups

- **Saved versions, and a History list that restores an earlier state.** Gzipped snapshots live in their own IndexedDB store. They are listed newest first, as `14:32 · before import · 806/481`. Expanding a row shows the delta against now and a two-tap `Restore this version`.

Two consequences are worth protecting. `resetAll` deliberately does **not** clear versions. That is what makes an accidental Reset recoverable rather than final. A restore also takes its own `before restore` milestone on the way in. So tapping the wrong row is survivable, not a second disaster.

The panel also carries **Backup** and **Backup + photos**. These moved out of the Sync panel. They are version actions: "save one off this device". The Sync panel is now a repair kit that only opens on failure. The History cell is gated on the versions **adapter**, never on the ledger. It holds the one control that undoes a Reset. Gating it on `items.length` would make it unreachable just after a Reset.

- **Two local backups and one remote.** *Backup* downloads `{mailday:1, items, received, envelopes, dateFilter, sortBy, itemSort}`. It is small, quick, and holds the irreplaceable part. *Backup + photos* appears only when photos exist. It adds `photos` as an `{id: dataURL}` map. Photos are memory aids, so paying their file size is opt-in. The file picker restores either one. Any `.json` file routes to restore, and any `.csv` file routes to import. The picker tolerates older backups that are missing newer keys. A restore is a full replace. So if pending envelopes are about to be replaced, the notice says so. They are hand-typed. Losing them silently would be the worst kind of quiet.
- Both the file restore and the GitHub pull funnel through one `applyBackup()`. That matters in two ways. The `!data.mailday || !Array.isArray(data.items)` check is the *only* thing between a corrupt payload and a wiped ledger, so it should exist once. The replaced-envelopes warning also covers the pull. That matters more there, because a pull is one tap, not a deliberate file drop.

## Photo ids on restore

The third arm (`extraPresent`) came with photo sync. It matters in two places that a narrower rule would lose data.

- One GET fails out of twelve. That strips that one id. The debounced save then writes the stripped ledger. The next push publishes it. That severs the link to a photo sitting safe on GitHub, which a retry would have fetched.
- The photo repo cannot be reached at all. Then every id would go at once.

**Keeping an id costs a blank manila tile until the next pull. Stripping it costs the photo.** So 26.13 is split. An id is stripped only if the store was actually *read* and did not hold it (26.13). An id is kept if the store could not be read (26.13b).

## Accepting a pull's bytes before its sha

The stored sha is accepted only after the bytes are applied. `pull()` returns the sha. `acceptPull()` stores it. The app calls `acceptPull()` after `applyBackup` has landed.

This rule came from a real incident. It happened on the first day of real two-device use and cost a check-in. `git log origin/data` has the receipt. Commit `87793de` is **byte-identical to `38017ae`, six days older**. It landed on top of a newer ledger with no conflict. Diff the blobs, not just the counts. Identical blobs are how you tell which device wrote what.

Failing to accept leaves the device merely *behind*. The next push then conflicts loudly. That is the direction this must fail in. Group 35.

## Merge ordering

The merge's ordering matches the one `doPull` depends on. **Photos are fetched before the ledger is applied.** The merge has a sharper reason too. The merge unions both devices' envelopes. So ids that arrive from the other device have no blob here yet. `applyBackup` would strip every one of them.

## peek() and auto-push

**The same `peek` is now also the auto-merge's trigger.** That is why it is one read, not two, and why the merge sits inside its `known` branch. The foreground call does three things at once. It reports whether the remote is ahead. It licenses or refuses the merge. Through `freshSession`, it decides whether this foreground was a new session at all.

- **Push / Pull (GitHub).** Automatic backup writes `ledger.json` to the **`data` branch** of `shivinate7/mailaudit-data`. That is the private repo, which also holds the photos on its `main` branch. The ledger used to sit on `mailaudit`'s own `data` branch. That is why `mailaudit` had to stay private. Moving it out let the source repo go public. The branch survives the move for a new reason. `listVersions` reads `commits?path=ledger.json&sha=data`, so that log is the version archive. Photo commits must stay off it. The old reason, that Pages deploys from main's root, is void in a repo that serves no site.

## Photos on their own branch

**Photos share the repo with the ledger, on their own branch.** The repo is `shivinate7/mailaudit-data`, which is **private**. Photos live on branch `main`, one file per photo, at `photos/<id>.<ext>`.

Earlier, the photos and the ledger were in two repos. Privacy was the whole reason for that. A mailing label carries a delivery address. The ledger repo was public. That reason ended when the ledger repo went private. The merge happened when `mailaudit` went public. The ledger had to leave it regardless. The merge buys **one repo in the token's blast radius instead of two**. `shivinate7.github.io` is a single origin across every Pages project. So the mitigation for a readable token is the fine-grained, Contents-only scope, which is now genuinely single-repo.

The privacy argument for separate repos is retired. Two other reasons outlived it. One applied only to the opposite merge, so it is retired too. The other is still live, and the code handles it.

- "Git is permanent while the app repo is the one you clone" argued against photos landing in `mailaudit`. The ledger moved *into* the photo repo, so `mailaudit` got smaller, not bigger. This argument never applied to this direction.
- "**GitHub's 409 on rapid successive Contents writes is per-repo**" is still live, and the code handles it. That is why `push()` now `await`s `spaceWrites()`, the same 1s clock that `pushPhoto` has always used. Before the merge, the ledger PUT could skip it, because it was the only write its repo ever saw. `app.jsx` pushes the ledger, then immediately loops photo uploads. **Remove that call, and the first photo of every push 409s.** The separate error tables still matter for the same reason they always did. A throttled photo must never reach `pushState`. `pushState === "conflict"` is the only gate on Push anyway.

Push and Pull each do both legs in one tap. The ledger goes first, and the photos go after.

Three things are load-bearing and non-obvious:

- **The photo phase has its own state and its own copy table (`PHOTO_SAYS`).** It must never write `pushState`. `pushState === "conflict"` is the only gate on **Push anyway**, which force-overwrites the *ledger*. GitHub answers 409 to rapid successive Contents writes on one repo. So routing a throttled photo upload through the ledger's error path would offer a button that silently discards another device's check-ins. Test 30.11.
- **A pull downloads before it applies.** If `applyBackup` ran first, every photo id would be stripped. Tests 30.5–30.9.
- **`listPhotos()` is three-valued.** A 404 means "nothing pushed yet" on a repo you can see. It means "you cannot see this repo" on a private one. GitHub hides existence rather than admitting a 403. So `listPhotos()` answers `{known:true, ids}` or `{known:false, reason}`. `photoPlan` refuses to compute `lost` or `toPush` when it does not know. A 404 is disambiguated by one extra `GET /repos/{owner}/{repo}`. Tests 26.13b and 30.13–30.15.

The whole algorithm is a **set difference over ids**. A photo file is immutable and addressed by its id. So each remote path is written exactly once, by whoever holds it. Nothing merges, nothing overwrites, and there is no second sha to track. Photo sync cannot conflict by construction. That property is why one-file-per-photo beat both a manifest and the Git Data API. Protect it.

## The ruled head

Three ruled cells report the state and open what changes it.

- **Orders from** shows the active range. It is the only cell with a figure line, `N lines · M outside`. The other two cells carry no figure. They would restate the masthead's own tallies a hundred pixels above.
- **Showing** is the old "Hide received" button, said as state (`○ Everything` / `● Unreceived`) rather than as an instruction. It starts on `● Unreceived` on every load. It is not persisted.
- **Sorted by** opens a panel of options. The app has no `<select>` any more.

Next is a **Find** row. It carries search. The canceled reference sits beside it, as another ruled cell. It is not an underlined link floating on its own line. Beside that is the `N stamped` filter, in the same cell style. It uses `○/●` and `aria-pressed`, not the canceled cell's caret. The reason is that it is a filter state, the Showing cell's idiom, not a disclosure. The row now holds two `flexShrink: 0` cells, and the search input absorbs the loss. Re-measure at 375px if either label grows.

## The action row and its disclosures

Below the Find row is the **action row**. It holds Re-import CSV, Sync, and Reset. These are equal ruled cells at full width. They use uppercase mono, like the view switch. They are 40px tall, like Find.

File management is not a filter. Earlier, the row used a different idiom. Three boxed mono buttons were pushed to the right edge, under a region made of hairlines. That broke the page. It made a tray of buttons in a different vocabulary. A void grew to ~450px at desktop width to their left. A Sync panel opened left-aligned under a chip that sat right.

The separation is now kept by treatment. The head cells are label-over-value state. The action row is bare uppercase actions. A thin rule above the row divides the two.

The row is styled as `.mdl-acts` in the `<style>` tag, not as inline styles. Its membership is conditional. It has one cell on an empty ledger, three with a remote, and four without. So the columns come from `grid-auto-flow: column`. The divider is each cell's own right rule, with `:last-child` dropped. "Last" cannot be a prop the way `headCell`'s is.

Sync carries the only caret. It turns accent while it is open. If `peek()` says the other device is ahead, the whole cell turns accent. Color does this rather than a badge, because the cell is one third of 375px.

Reset is red text at rest. **Armed, it takes the whole row.** It shows a red fill and "Tap again to clear everything". The other two cells step out for the four seconds it lasts. This is the better two-tap, not a compromise. The target grows over the spot just tapped, instead of wrapping to a new line under it. The two controls a mis-tap could land on are not there to land on.

Two details are load-bearing and easy to undo by accident:

- **The two cells that open something underline their value.** A cell built from the same parts as the masthead's *read-only* tallies reads as a statistic. The first draft scored 2/5 on discoverability with a reviewer for exactly this. The underline is a form's write-on rule, not a button box. So the thesis survives.

## Panels close each other

**History and Sync close each other**, the way the range and sort cells already do. Both panels are several hundred pixels tall. Stacked, they push the packages off the screen. An armed Reset closes both, since it already hides the cells that open them. Leaving the panels up with no control was the same one-way-door shape as the line itself.

**The upload zone opens on an empty ledger only when there are no envelopes either.** It was once forced open by an empty *item* list alone. That made the Re-import cell beside it a disclosure that flipped `aria-expanded` over a panel that was open regardless. If envelopes exist, Re-import stays reachable (test 23.2). Tests 23.2b–23.2d.

## Detecting a stalled sync

**`ahead` is one of the cases `syncBroken` checks, and leaving it out was the worst hole the silent sync opened.** Auto-push declines while the remote is ahead. The auto-merge fires only on a *fresh session*. So a device that goes behind mid-session stops backing up entirely, for the rest of that session.

The manila "pushed newer lines" advisory still exists. But it lives *inside* the panel. The panel's only entrance is this line. So only someone who already knew to look could find it.

The 24h staleness backstop could not rescue this case. `syncBroken` is a `useMemo` that reads `Date.now()`. A stalled device changes none of its deps, so that comparison is frozen too. Tests 38b.1–38b.3.

## The sync panel's contents

**`remoteInfo == null` returns `null`, not `"no-key"`.** It is null until its effect runs, one commit after first paint. Reading it as "no key" flashed the manila banner on every cold start of a perfectly configured device. This follows the same three-valued rule that `peek` and `listPhotos` follow. "I have not looked" is not "all clear", in either direction.

**It renders on `syncBroken || syncOpen`, and it is a TOGGLE.** Both halves were learned by shipping without them. The bug was reported from the phone within the hour. The panel opened on tap, and nothing closed it. Removing the Sync cell had taken the only control that could. Worse, once you fixed the thing it was complaining about, `syncBroken` went null. The line disappeared, and the panel stayed open with no control at all. **A disclosure has to be its own way back out.**

While the panel is open, the line is that panel's header. When the sync is healthy, the line goes quiet (`Backed up 09-06 — tap to close`, transparent rather than manila). It does not vanish. A header reading "not backed up" over a ledger that just pushed would be a lie. Tests 28.8–28.12, both halves mutation-confirmed.

The harness had a hole that hid this. The remote mock set `pushedAt` to the frozen `REMOTE_NOW` (2026-08-12). **Every fixture was permanently past `SYNC_STALE_MS`, so the healthy state, `syncBroken === null` — was unreachable from a test.** It is `Date.now()` now. The frozen clock stays for payload snapshots, so they do not depend on the wall clock. This timestamp is status metadata that nothing asserts on.

The action row keeps its three equal cells. **History takes the one that Sync vacated.** Behind the line sit Push, Merge, Pull, Push anyway, the target line, and the key field. `Merge` appears on a conflict. It also appears if `peek()` says the other device is ahead. It covers the case the automatic path could not finish.

There is one accepted cost. A device whose sync is healthy has no way into the panel. So a key cannot be rotated *proactively*. In practice, a token that needs replacement has expired. That errors, and the error raises the line.

`Merge` is filled **accent violet**, the app's "this is the live control" color. It is the safe resolution, so it is the primary one. The force beside it stays advisory manila.

The panel uses the same `panelWrap` surface as the date and sort disclosures. It also has the same contents: an `optGrid(2)` of action cells over a block of *particulars*. The actions are built as data (`syncActions`, just above the component's `return`). The grid has to know the count. An odd last cell spans the row. Otherwise the rule color shows through the empty half as a slab. The range panel uses the same trick.

Two columns are used everywhere, like the sort panel. "Pull from GitHub" and the armed "Tap again to replace" both need the ~160px that a half of 375px gives them. Neither fits a third.

Each entry carries its own color. The grid's one accent means "on", and these entries mean five things:

- Pushed ✓ uses green text.
- Merge uses an accent fill.
- Push anyway uses manila, with a manilaInk fill once armed.
- Pull uses a red fill once armed.
- Auto-push uses the accent fill if it is on, and inkSoft if it is off.

The particulars (`partGrid`) are the head cells' two parts laid on their side. They have `LEDGER` / `PHOTOS` / `KEY` micro-labels beside mono values. They replace a target line that floated after the buttons as bare text. The value track is `minmax(0, 1fr)`. So the 44-character photo target wraps inside it at 375px, rather than pushing the panel past the page.

The token field is a write-on rule like Find, not a box. It is **16px**, because iOS zooms the page on focusing any smaller input. The viewport meta deliberately leaves zoom on. The old 12px box zoomed on every paste.

Re-import and Reset stay on the narrower `items.length > 0 || envelopes.length > 0` gate. Sync survives that narrower gate. An empty ledger is the case that most needs Pull. Group 28.

## See also

- `card-tally-row-counts-first` — why the Tally row orders its meta line the way it does.
- `unit-rate-is-not-the-position` — the figure the Tally sort calls "unit rate".
- `cost-basis-excludes-ship-and-tax` — what basis counts and what it leaves out.
- `orphaned-mail-never-decides` — the invariant Orphaned's ranking must never cross.
- `stamp-removal-writes-a-tombstone` — how a removed stamp survives a merge.
- `one-stamp-per-package` — why picking a new stamp kind replaces, not stacks.
- `versions-get-their-own-database` — why saved versions live outside the photo store.
- `milestones-taken-before-risk` — when a milestone version is taken.
- `sha-accepted-only-after-apply` — the rule the sync panel's Push/Pull rest on.
- `peek-is-three-valued` — what peek() answers and why unknown is not clear.
- `one-repo-for-both-halves` — why the ledger and photos share one repo now.
- `photo-sync-cannot-conflict` — why photo sync needs no sha at all.
