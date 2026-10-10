# Mail Day Ledger

A single-page tool for checking off TCGplayer card orders as the mail arrives. The
owner buys hundreds of low-cost cards from many sellers. The app reads OrderWand
CSV exports of that order history. It gives one checklist. Mark a card as
received, see what is outstanding and what it cost, and flag mail that may be
lost.

Three views read the same check-in data. **Packages** pairs an order with a
seller, and it is the mail-day working view. **Tally** pools one product name
across every seller, which answers "did all four arrive" and carries the cost
basis. **Orphaned** holds a package that arrives with no way to tell who sent it.

The app presents itself as MANIFEST. The project name, the repo name and the
storage namespace do not follow the masthead. See `masthead-is-not-project-name`.

## How to read this file

This file is an index, and it holds no argument of its own. Every ruling lives in
one record, and each record holds current text only; git keeps the history. Read the
records your task needs. Do not read them all.

- `invariants/` holds a rule that must not break. 8 records.
- `decisions/` holds a ruling and the reason it still holds. 180 records.
- `measurements/` holds a measured figure and how to re-measure it. 8 records.

A record cites another record by slug, never by a path, so a record survives a
move. `npm run check:records` proves five things. This index cites every record.
Every citation resolves. No slug repeats. No fence is broken. Every record
carries its shape.

An open question carries a `**Status:**` line. That line is the only thing that
separates a question still open from a ruling already settled, so keep it.

## Working here

The owner's global rules govern this repo, and this file does not restate them.
Two paragraphs here used to duplicate them, one on which tasks to escalate and
one on judging a rule by its outcome. Both are in the global file, so both are
cut rather than kept in two places that can disagree.

One local lesson is worth the space, because this repo paid for it. A rule here
can outlive the constraint that produced it. The argument that "the ledger repo
is public" stayed the load-bearing reason for a design long after the repo went
private. So check whether a reason still holds before you design around it, and
verify against the repo rather than against this file.

## Invariants

Eight rules. Breaking one costs the owner months of check-in data.

- `imports-merge-never-replace` — Imports merge, never replace.
- `no-layout-shift-under-pointer` — No layout shift under the pointer.
- `no-native-dialogs` — No native browser dialogs.
- `orphaned-mail-never-decides` — Orphaned mail never decides anything.
- `parser-filters` — Parser keeps only TCG purchases.
- `saved-state-shape` — Saved-state shape is fixed.
- `storage-keys-are-frozen` — Storage keys are frozen.
- `the-token-is-a-credential` — The GitHub token is a credential.

## Storage and the platform layer

Nothing in the component touches a storage API. Three adapters do, and each fails in its own way.

- `single-file-architecture` — One component file, one platform layer.
- `storage-split-three-adapters` — The component never touches a storage API directly.
- `versions-get-their-own-database` — Saved versions live in their own IndexedDB database.
- `shared-origin-needs-namespace` — The Pages origin is shared, so storage is namespaced.
- `every-origin-has-own-storage` — Every origin holds a separate ledger.
- `file-protocol-works-locally` — The file protocol supports everything the app needs.
- `b64-fails-with-plausible-data` — Base64 lives in its own module.
- `photo-rules-fails-quietly` — Photo rules are pure and separately tested.
- `remote-rules-fail-quietly` — Remote status mapping is pure and tested.
- `merge-rules-only-add` — The two-device merge only ever adds.
- `version-tiers-are-unioned` — Version-retention tiers are unioned, never intersected.

## Sync, the remote and the token

Sync runs itself. These records say what it refuses to do, and why each refusal is the safe direction to fail in.

- `remote-is-transport-not-storage` — The remote adapter is transport, not storage.
- `sync-runs-itself` — Sync runs itself, with no toggle.
- `push-and-merge-guard-differently` — Push and merge guard on different confirms.
- `auto-push-safe-as-merge-exists` — Auto-push is safe only because merge exists.
- `sha-accepted-only-after-apply` — The stored sha waits for the apply.
- `pushforce-sha-only-after-write` — pushForce records the sha after the write.
- `peek-is-three-valued` — peek is three-valued, not a guess.
- `listphotos-is-three-valued` — listPhotos is three-valued too.
- `offline-is-decided-by-fetch` — Offline is decided by a failed fetch.
- `pull-needs-a-key-too` — Pull now needs the same key.
- `stale-push-conflict-pull-two-tap` — Pull gets the two-tap, push does not.
- `merge-carries-no-two-tap-arm` — Merge never needs a two-tap arm.
- `two-device-merge-proven-first` — Prove the two-device merge before trusting auto-push.
- `remote-sync-is-off-the-save-path` — Remote sync never touches the save indicator.
- `fine-grained-token-single-repo` — One fine-grained token, scoped to one repo.
- `token-lives-outside-namespace` — The access token sits outside the storage namespace.
- `one-repo-for-both-halves` — The source repo is public and holds no data.
- `data-branch-setup` — The data branch is the ledger's history, not a scratch file.
- `photo-branch-must-preexist` — The photo branch must exist before any upload.
- `pull-fetches-photos-before-apply` — A pull fetches photos before it applies.
- `ledger-and-photos-share-a-repo` — The ledger and the photos share one repo.
- `photo-writes-wait-one-second` — Photo writes wait one second after the ledger.
- `null-remote-info-is-not-no-key` — A null remote status is not a missing key.

## Envelope photos

A photo is a picture of a mailing label. It never enters the ledger, and it can never lose a conflict.

- `photos-stay-out-of-the-ledger` — Photo blobs never enter the ledger.
- `photo-sync-cannot-conflict` — Photo sync cannot conflict by design.
- `photo-errors-never-hit-pushstate` — A photo error never reaches pushState.
- `photo-ids-restore-keep-if-known` — A restore keeps a photo id when known.
- `photo-ids-unreadable-local` — An unreadable local photo store keeps ids.
- `label-photos-downscale-to-2000px` — Label photos downscale to 2000px.
- `orphan-sweep-drops-unused-photos` — The sweep drops photos no envelope uses.

## Saved versions and recovery

A milestone is taken before the risky step, never after. Read these before changing anything that restores.

- `milestones-taken-before-risk` — Milestones save before the risky step.
- `a-restore-is-not-local` — A restore is not local.
- `older-versions-come-off-branch` — Older versions come from the branch.
- `unwritable-store-says-so` — A broken version store must say so.
- `recovery-control-not-state-gated` — A recovery control cannot need the state it recovers.
- `history-restores-a-saved-version` — History lists saved versions and restores one.
- `backup-files-restore-two-ways` — Backup files restore with or without photos.
- `every-restore-passes-applybackup` — Every restore passes through applyBackup.

## The public seed

The site is public and the ledger repo is not. The seed closes that gap, and one check says what it publishes.

- `the-public-seed` — A public seed hydrates a visitor's empty ledger.
- `seed-load-guards` — The seed never overwrites a keyed device.
- `check-seed-backstop-not-proof` — Check the built seed by decoding it, not by reading the code.
- `ledger-remote-needed-for-seed` — A build needs the data remote to seed the page.

## The three views

Packages, Tally and Orphaned read one check-in map. These records say what each view may and may not decide.

- `cost-basis-excludes-ship-and-tax` — Cost basis excludes shipping and tax.
- `unit-rate-is-not-the-position` — Unit rate and position differ on purpose.
- `tally-pools-on-the-exact-name` — Tally pools by exact product name.
- `search-filters-inside-package` — A search result needs a way back.
- `a-reveal-ignores-hidedone-too` — A reveal ignores hideDone too.
- `order-id-button-stops-propagate` — The order id link stops propagation.
- `lost-mail-flags-use-order-date` — Lost-mail flags count from the order date.
- `three-views-share-one-switch` — Three views share one switch.
- `tally-counts-ignore-the-filters` — Tally counts cover every copy, filtered or not.
- `tally-row-lists-its-copies` — A Tally row lists every copy it counts.
- `tally-sort-keys-are-six` — The Tally view sorts on six keys.
- `package-sort-swaps-with-view` — Package sort swaps with the view.
- `packages-group-by-order-seller` — Packages group by order and seller.
- `outstanding-value-per-level` — Each level states what is still outstanding.
- `canceled-orders-leave-the-list` — Canceled orders leave the list, not the record.
- `orphan-entry-takes-one-input` — Recording an envelope takes one input.
- `candidates-skip-date-filter` — Candidates ignore the date filter and canceled orders.
- `assign-checks-recorded-cards` — Assigning an envelope checks in only its recorded cards.
- `envelope-names-match-normname` — Envelope names match after normalizing.
- `csv-import-shows-a-summary` — A CSV import shows a summary.

## Order stamps

One stamp per package, set by hand. A refund takes the package out of every count.

- `one-stamp-per-package` — One stamp per package, latest wins.
- `stamp-removal-writes-a-tombstone` — Removing a stamp writes a tombstone.
- `a-refund-leaves-every-count` — Refunded packages leave every count.
- `stamped-package-hides-lost-flag` — A stamp hides the lost-mail warning.
- `stamp-band-opens-the-editor` — The stamp band is the control.
- `stamped-filter-on-the-pipeline` — The stamped filter sits on the normal pipeline.

## The ruled head

The control region is the masthead's own vocabulary continued. Read these before changing a control there.

- `ruled-head-resume-is-reopening` — A resume counts as reopening.
- `ruled-head-masthead-vocabulary` — The ruled head continues the masthead.
- `ruled-head-one-advisory-entrance` — One advisory line is sync's only entrance.
- `ruled-head-panels-carry-no-fill` — Disclosure panels carry no fill.
- `ruled-head-showing-unreceived` — Showing starts on unreceived every load.
- `ruled-head-hand-elapsed-forward` — Hand the elapsed time forward, never re-derive it.
- `ruled-head-range-picked` — The custom date range is picked, not typed.
- `ruled-head-stale-clock-agreement` — The staleness clock measures agreement, not writes.
- `date-filter-spans-ledger-views` — The date filter applies to both ledger views.
- `action-row-is-ruled-cells` — The action row is ruled cells, not buttons.
- `armed-reset-takes-the-row` — An armed Reset takes the whole action row.
- `disclosure-cells-underline-value` — Cells that open something underline their value.
- `history-sync-close-each-other` — History and Sync close each other.
- `upload-zone-opens-when-empty` — The upload zone opens only on an empty ledger.
- `sync-line-toggles-its-panel` — The sync line is also the panel's way out.
- `merge-is-the-primary-sync-action` — Merge is the primary sync action.
- `sync-panel-is-two-column-grid` — The sync panel is a two-column option grid.
- `sync-particulars-ruled-values` — Sync particulars are ruled label and value pairs.
- `token-field-is-sixteen-pixels` — The token field is 16px to stop iOS zoom.

## Motion

The register is stationery, not software. One rule governs all of it: nothing may reflow.

- `motion-a-card-opens-in-order` — A card lays its rows down in order.
- `motion-completed-package-gilded` — A completed package is gilded, not badged.
- `motion-collapse-not-animated` — Collapsing a card runs with no animation.
- `motion-disclosure-panels-arrive` — Disclosure panels fade in, their space does not.
- `motion-stationery-not-software` — Motion reads as stationery, not software.
- `motion-method-side-by-side-proof` — Each motion was chosen by looking, not by reading.
- `motion-nothing-may-reflow` — No animation can cause a reflow.
- `motion-reduced-leaves-it-drawn` — Reduced motion leaves every animation at its final frame.
- `motion-remeasure-not-rereason` — Motion timing claims need a real browser, not a test.
- `motion-the-check-tick-is-written` — The check tick is written, not popped in.
- `motion-letterhead-composes-once` — The letterhead composes itself once per load.
- `motion-masthead-bar-sweeps-once` — The masthead bar turns green a beat late.
- `motion-the-stamp-lands` — The RECEIVED stamp lands, it does not appear.
- `motion-the-switch-is-one-object` — The view switch moves one object, not three lights.
- `motion-use-just-became` — useJustBecame guards every celebration animation.

## The masthead, the cards and the palette

Where the page holds its shape, and where every colour comes from.

- `card-tally-row-counts-first` — The Tally row degrades sets first, never counts.
- `card-the-action-row-is-reserved` — The card action row reserves its tallest height.
- `card-the-bar-is-out-of-flow` — The package progress bar sits out of flow.
- `design-form-controls-no-inherit` — Form controls need their own font rule.
- `design-parchment-ledger` — The palette is parchment ledger.
- `design-view-switch-equal-thirds` — The view switch is equal thirds.
- `masthead-is-one-letterhead` — The masthead is one letterhead, not stacked boxes.
- `masthead-sizing-by-clamp` — Masthead sizing uses clamp, never breakpoints.
- `masthead-tallies-unequal-thirds` — The tally cells are not sized equally.
- `masthead-running-head-sticky` — The running head pins by opacity, never by height.
- `masthead-save-slot-reserved` — The save indicator sits in a reserved, fixed-size slot.
- `palette-gold-is-ornament-only` — Gold is ornament only, never text.
- `palette-inksoft-and-manilaink` — inkSoft and manilaInk are checked against the right surface.
- `palette-silver-stays-cool` — Silver must stay a cool grey.
- `palette-theme-color-tracks-paper` — The browser chrome colour must track the paper token.
- `palette-tokens-contrast-floor` — Every colour token meets a contrast floor.

## Build, CI and assets

What each check asks, and the two traps in the icon pipeline.

- `check-build-ignores-seed` — The build check compares code, and ignores the seed.
- `ci-filters-guarantee-no-rebuild` — CI filters replace the old no-workflows guarantee.
- `watchdog-catches-silent-failure` — A scheduled watchdog checks the backup, not the phone.
- `pages-queued-workflow-fix` — A stuck Pages deploy needs a new commit, not a re-run.
- `favicon-is-a-different-drawing` — The favicon is redrawn, not the master shrunk.
- `icon-paths-and-export-gotchas` — Icon paths stay relative, and iOS caches hard.
- `masthead-is-not-project-name` — The masthead is not the project name.
- `main-moves-only-by-pr` — Main moves only by pull request, admins included.
- `screens-checked-headless-in-ci` — Each view is checked headless at 375 and 760px.
- `records-hold-current-text-only` — Records hold current text only; git keeps history.
- `records-name-what-dates-them` — Each decision names the fact that would date it.
- `readme-is-minimal` — The README is minimal, and carries no license.
- `orchestrator-may-merge` — The orchestrating session may merge green, reviewed PRs.
- `invariants-cited-by-slug` — Invariants are cited by slug, never by number.

## Testing method

Lessons this repo paid for. Each one came from a green suite that hid a real defect.

- `testing-green-suite-hides-break` — A green suite can hide a broken feature.
- `testing-mock-is-test-below-seam` — A mock is the test below the seam.
- `testing-pull-payload-eq-void` — After a pull, payload equality proves nothing.
- `testing-unfailable-assert-decor` — An assertion that cannot fail is decoration.
- `testing-throwing-assert-bad-kill` — An assertion that throws is a worse kill.
- `testing-check-something-rereads` — Check that something re-reads the value.
- `testing-jsdom-has-no-layout` — jsdom has no layout.
- `testing-isolate-each-tier` — One tier must not decide another.
- `testing-chokepoint-two-branches` — When a chokepoint has two branches.
- `testing-mock-field-stops-decor` — When a mock field stops being decorative.
- `testing-mutant-dies-check-cause` — When a mutant dies, check the cause.
- `testing-surviving-mutant` — When a mutant survives, find the unreached state.
- `newer-features-test-proof-only` — Newer features have only test proof.

## Reference

A fact an agent needs, that argues nothing. Read the CSV record before touching the parser.

- `assets-and-icons` — Icon files and how to export them.
- `build-and-deploy` — Build, test and deploy commands.
- `design-language` — The parchment ledger's look and feel.
- `live-verification` — What has run against real GitHub or a real device.
- `orderwand-csv` — The OrderWand CSV schema and quirks.
- `test-groups` — What each test group covers.
- `test-harness` — How to drive the behaviour suite.

## Open threads

A question this repo has not closed, or a risk it accepted on purpose. Each record carries a status.

- `a-host-migration-resets-storage` — A host migration resets phone storage.
- `auto-apply-happens-now` — Auto-apply happens now, and why that changed.
- `ci-runs-in-utc` — CI runs the suite outside UTC, so test 38.9 runs there.
- `envelope-deletion-unrepresented` — Envelope deletion is not represented.
- `itp-may-clear-storage` — ITP may clear storage after seven idle days.
- `max-cannot-express-an-uncheck` — `max` on received cannot express an un-check.
- `nothing-recovers-without-the-key` — Nothing recovers without the key.
- `peek-is-verified-only-on-refusal` — `peek()` is verified only on its refusal path.
- `photos-in-git-are-permanent` — Photos in git are permanent.
- `the-conflict-guard-is-unverified` — The conflict guard is unverified against real GitHub.
- `ledger-private-source-public` — The ledger repo is private, the source repo is public.
- `token-expires-without-warning` — The token expires with no warning.
- `token-sits-on-shared-origin` — The token sits on a shared origin.
- `the-token-used-to-span-two-repos` — The token used to span two repositories.
- `watchdog-lives-in-private-repo` — The backup watchdog lives in the private repo.
- `the-write-budget-is-shared` — The write budget is shared with the ledger push.
- `vendor-toggle-undecided` — The vendor toggle stays undecided.

## Measurements

Each figure was measured in a real viewport or on a real device. A test cannot hold most of them, and each record says how to take the number again.

- `card-reserved-geometry` — Card reserved geometry heights.
- `ledger-and-seed-sizes` — Ledger, seed, and version sizes.
- `masthead-foot-slot` — Masthead foot save-slot width.
- `motion-timings` — Motion sheet durations and beats.
- `palette-contrast` — Palette token contrast ratios.
- `ruled-head-heights` — Ruled head control region heights.
- `suite-size` — Test suite assertion count and run time.
- `switch-thirds-and-seal` — View switch, seal, and tally headroom.

## Build and deploy

```
npm install
npm run build          # -> index.html
npm test               # the behaviour suite
npm run check:build    # is the committed index.html this repo's code?
npm run check:seed     # what does the seed in that page publish?
npm run check:docs     # do this file's numbers and paths hold?
npm run check:records  # does the record corpus hold together?
npm run deploy         # build, test, then open a pull request
npm run serve          # a local server on :4173
```

The steps and the traps live in `build-and-deploy`. Main moves by pull request
only, so `deploy` opens one rather than pushing.
