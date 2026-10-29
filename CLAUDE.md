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
- `docs/decisions/` holds a ruling and the reason it still holds.
- `measurements/` holds a measured figure and how to re-measure it. 11 records.
- `docs/debts/` holds one known gap or to-do per file, each pointing at its decision.

A record cites another record by slug, never by a path, so a record survives a
move. `npm run check:records` proves eight things. This index cites every record.
Every citation resolves. No slug repeats. No fence is broken. Every record
carries its shape. Every invariant names the test that pins it. Every decision
holds a Holds-while line, every open thread a Status line, and the index lists
no slug twice. Every debt holds a Status line and a Decision line.

An open question carries a `**Status:**` line. That line is the only thing that
separates a question still open from a ruling already settled, so keep it.

## Working here

The owner's global rules govern this repo, and this file does not restate them, so the two cannot disagree.

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

## Sync, the remote and the token

Sync runs itself. These records say what it refuses to do, and why each refusal is the safe direction to fail in.

- `remote-is-transport-not-storage` — The remote adapter is transport, not storage.
- `sync-runs-itself` — Sync runs itself, with no toggle.
- `push-and-merge-guard-differently` — Retired: the push guard left with the GitHub mirror.
- `auto-push-safe-as-merge-exists` — Retired: auto-push left with the GitHub mirror.
- `sha-accepted-only-after-apply` — The stored sha waits for the apply.
- `pushforce-sha-only-after-write` — Retired: no caller reaches the GitHub force path.
- `peek-is-three-valued` — Retired: the app no longer calls peek.
- `listphotos-is-three-valued` — listPhotos is three-valued too.
- `offline-is-decided-by-fetch` — Offline is decided by a failed fetch.
- `pull-needs-a-key-too` — A pull needs the same key.
- `stale-push-conflict-pull-two-tap` — Retired: the stale-push merge ran on the GitHub mirror.
- `merge-carries-no-two-tap-arm` — Merge runs unattended, with no two-tap arm.
- `max-cannot-express-an-uncheck` — A per-key time lets an un-check beat an older check.
- `envelope-deletion-unrepresented` — A discarded envelope leaves a tombstone that a stale copy cannot revive.
- `two-device-merge-proven-first` — Retired: its two-device steps drove the GitHub mirror.
- `merge-readopts-sync-generation` — A merge re-adopts the sync generation.
- `push-flash-waits-for-photos` — Retired 2026-10-12: the Pushed flash has no control.
- `remote-sync-is-off-the-save-path` — Remote sync never touches the save indicator.
- `fine-grained-token-single-repo` — One fine-grained token, scoped to one repo.
- `token-lives-outside-namespace` — The access token sits outside the storage namespace.
- `one-repo-for-both-halves` — The source repo is public and holds no data.
- `data-branch-setup` — The data branch is frozen ledger history, not a scratch file.
- `photo-branch-must-preexist` — The GitHub photo branch stays until the copy runs.
- `pull-fetches-photos-before-apply` — A merge fetches photos before it applies.
- `ledger-and-photos-share-a-repo` — The private data repo holds the frozen history and the photo source.
- `photo-writes-wait-one-second` — Retired: GitHub photo writes left the web app.
- `null-remote-info-is-not-no-key` — A null remote status is not a missing key.
- `worker-keeps-snapshots` — The Worker keeps daily snapshots, and GitHub leaves the sync role.
- `sync-revamp-cloudflare` — Sync moves from GitHub to Cloudflare, and orders arrive with no export.

## The native client

MANIFEST is rebuilt in Swift. These records say what both clients share, what they do not, and the order of the work.

- `native-swift-rebuild` — MANIFEST is rebuilt as a native Swift client.
- `native-build-lanes` — The native build runs in ordered lanes.
- `native-parity-table` — Each feature has one scope in the native rebuild.
- `rules-run-in-javascriptcore` — The Swift client runs the view rules in JavaScriptCore.
- `shared-tokens-and-fixtures` — Both clients read one token file and one fixture set.
- `native-key-via-url-scheme` — The native client takes its key through a custom URL scheme.
- `native-ledger-is-raw-json` — The native client keeps the ledger as raw JSON.
- `native-reply-waits-generation` — A native reply applies only to a ledger that has not changed.
- `native-files-are-frozen` — Native file names freeze on first ship.
- `native-ci-on-hosted-macos` — The native job runs on a hosted macOS runner.
- `csv-import-stays-web` — CSV import stays on the web app.
- `one-simulator-per-mac` — Simulator boots and load follow the global machine rules.
- `native-ships-via-testflight` — The iOS app ships through TestFlight.
- `duo-card-in-hand` — On the iPhone Duo, Card in Hand checks cards in by name.

## Envelope photos

A photo is a picture of a mailing label. It never enters the ledger, and it can never lose a conflict.

- `photos-stay-out-of-the-ledger` — Photo blobs never enter the ledger.
- `photo-sync-cannot-conflict` — Photo sync cannot conflict by design.
- `photo-errors-never-hit-pushstate` — A photo error never reaches pushState.
- `photo-ids-restore-keep-if-known` — A restore keeps only the photo ids this device holds.
- `photo-ids-unreadable-local` — An unreadable local photo store keeps ids.
- `photo-thumbnails-and-viewer` — Thumbnails are 56px squares, and the viewer is a scrim.
- `photo-sweep-two-guards` — The photo sweep has two guards.
- `pull-warns-on-what-it-drops` — A lost photo warns after 7 days, never on the pull.
- `label-photos-downscale-to-2000px` — Label photos downscale to 2000px.
- `orphan-sweep-drops-unused-photos` — The sweep drops photos no envelope or draft uses.

## Saved versions and recovery

A milestone is taken before the risky step, never after. Read these before changing anything that restores.

- `milestones-taken-before-risk` — Milestones save before the risky step.
- `a-restore-is-not-local` — A restore is not local.
- `older-versions-come-off-branch` — Older versions come from the branch.
- `unwritable-store-says-so` — A broken version store must say so.
- `recovery-control-not-state-gated` — A recovery control cannot need the state it recovers.
- `retention-tiers-are-unioned` — Any one of four tiers keeps a version.
- `hourly-tier-closes-the-gap` — The hourly tier keeps one version per hour for a day.
- `anchors-are-derived-not-stored` — Hour and day anchors are computed at prune time.
- `anchor-is-the-earliest-record` — An anchor is the earliest version of its bucket.
- `history-restores-a-saved-version` — History lists saved versions and restores one.
- `backup-files-restore-two-ways` — Backup files restore with or without photos.
- `every-restore-passes-applybackup` — Every restore passes through applyBackup.
- `recent-checks-can-be-undone` — Recent actions can be undone by tap.

## The public seed, removed

The site is public and the ledger repo is not. The page publishes no ledger data, and one check refuses it.

- `the-public-seed` — The public seed is removed.
- `seed-load-guards` — The seed load guards are retired.
- `check-seed-backstop-not-proof` — Check the built page, not the code that builds it.
- `ledger-remote-needed-for-seed` — The ledger remote is not needed for a build.

## The three views

Packages, Tally and Orphaned read one check-in map. These records say what each view may and may not decide.

- `cost-basis-excludes-ship-and-tax` — Cost basis excludes shipping and tax.
- `unit-rate-is-not-the-position` — Unit rate and position differ on purpose.
- `tally-pools-on-the-exact-name` — Tally pools by exact product name.
- `search-filters-inside-package` — A search result needs a way back.
- `a-reveal-ignores-hidedone-too` — A reveal ignores hideDone too.
- `order-id-button-stops-propagate` — Order id controls stop their clicks.
- `lost-mail-flags-use-order-date` — Lost-mail flags count from the order date.
- `orphaned-colours-by-meaning` — Orphaned uses colour for the same meanings.
- `undo-removes-only-its-delta` — Undo subtracts its own delta, not a snapshot.
- `three-views-share-one-switch` — The bar's working views share one check-in state.
- `search-hide-keep-tally-counts` — Search and hide-received never change shown Tally counts.
- `tally-row-lists-its-copies` — A Tally row lists every copy it counts.
- `tally-sort-keys-are-six` — The Tally view sorts on six keys.
- `package-sort-swaps-with-view` — Package sort swaps with the view.
- `packages-group-by-order-seller` — Packages group by order and seller.
- `outstanding-value-per-level` — Each level states what is still outstanding.
- `canceled-orders-leave-the-list` — Canceled orders leave the list, not the record.
- `orphan-entry-takes-one-input` — Recording an envelope takes one input.
- `new-envelope-ends-an-envelope` — The New envelope control ends the current envelope.
- `candidates-skip-date-filter` — Candidates ignore the date filter and canceled orders.
- `assign-checks-recorded-cards` — Assigning an envelope checks in only its recorded cards.
- `shrunk-envelope-gets-fresh-stamp` — A partial assignment restamps the envelope.
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

## House UX

House UX rules that govern the screens. Read these before changing a screen.

- `ux-house-rules-govern` — MANIFEST screens follow the house UX rules.
- `spacing-on-4px-grid` — Spacing moves to a 4px grid with an 8px card radius.
- `phone-nav-is-bottom-bar` — Phone navigation is a bottom glass bar, built in L11a.
- `ledger-tab-holds-options` — The Ledger tab holds the options, built in L11b.

## The ruled head

The control region is the masthead's own vocabulary continued. Read these before changing a control there.

- `ruled-head-resume-is-reopening` — A resume counts as reopening.
- `ruled-head-masthead-vocabulary` — The ruled head continues the masthead.
- `ruled-head-one-advisory-entrance` — One advisory line leads to the Sync group.
- `ruled-head-panels-carry-no-fill` — Overlay panels take the paper fill.
- `ruled-head-showing-unreceived` — Showing starts on unreceived every load.
- `ruled-head-hand-elapsed-forward` — Hand the elapsed time forward, never re-derive it.
- `ruled-head-range-picked` — The custom date range is picked, not typed.
- `ruled-head-stale-clock-agreement` — The staleness clock measures agreement, not writes.
- `date-filter-spans-ledger-views` — The date filter applies to both ledger views.
- `action-row-is-ruled-cells` — The action row is retired, and its cells are ruled rows.
- `armed-reset-takes-the-row` — An armed Reset arms in place.
- `disclosure-cells-underline-value` — Cells that open something underline their value.
- `history-sync-close-each-other` — History and Sync close each other.
- `upload-zone-opens-when-empty` — The upload zone opens only on an empty ledger.
- `sync-line-toggles-its-panel` — The sync line is also the panel's way out.
- `merge-is-the-primary-sync-action` — Retired 2026-10-12: Merge left the UI.
- `sync-panel-is-two-column-grid` — The sync panel is server status, last sync and a key box.
- `sync-particulars-ruled-values` — Sync particulars are ruled label and value pairs.
- `token-field-is-sixteen-pixels` — The key field is 16px to stop iOS zoom.

## Motion

The register is stationery, not software. One rule governs all of it: nothing may reflow.

- `motion-a-card-opens-in-order` — A card lays its rows down in order.
- `motion-completed-package-gilded` — A completed package is gilded, not badged.
- `motion-collapse-not-animated` — Collapsing a card runs with no animation.
- `motion-disclosure-panels-arrive` — Disclosure panels overlay the list and do not push it.
- `motion-stationery-not-software` — Motion reads as stationery, not software.
- `motion-method-side-by-side-proof` — Each motion was chosen by looking, not by reading.
- `motion-nothing-may-reflow` — No animation can cause a reflow.
- `motion-reduced-leaves-it-drawn` — Reduced motion leaves every animation at its final frame.
- `motion-remeasure-not-rereason` — Motion timing claims need a real browser, not a test.
- `motion-the-check-tick-is-written` — The check tick is written, not popped in.
- `motion-letterhead-composes-once` — The letterhead composes itself once per load.
- `motion-masthead-bar-sweeps-once` — The masthead bar turns green a beat late.
- `motion-the-stamp-lands` — The RECEIVED stamp lands, it does not appear.
- `motion-the-switch-is-one-object` — The active view moves one object, not three lights.
- `motion-use-just-became` — useJustBecame guards every celebration animation.

## The masthead, the cards and the palette

Where the page holds its shape, and where every colour comes from.

- `card-tally-row-counts-first` — The Tally row degrades sets first, never counts.
- `card-the-action-row-is-reserved` — The card action row reserves its tallest height.
- `card-the-bar-is-out-of-flow` — The package progress bar sits out of flow.
- `design-form-controls-no-inherit` — Form controls need their own font rule.
- `design-parchment-ledger` — The palette is parchment ledger.
- `design-view-switch-equal-thirds` — The view switch is retired. Its chrome rules still hold.
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
- `audit-skips-measured-flags` — The native audits skip only named, owner-ruled findings.
- `progress-bar-accent-then-green` — The progress bar is accent, then green at 100%.
- `typography-cochin-and-mono` — Cochin sets words, monospace sets numbers.

## Build, CI and assets

What each check asks, and the two traps in the icon pipeline.

- `check-build-ignores-seed` — The build check compares the whole page.
- `ci-filters-guarantee-no-rebuild` — CI filters replace the old no-workflows guarantee.
- `ci-skips-draft-prs` — CI skips draft pull requests after a proof.
- `watchdog-catches-silent-failure` — Retired: the owner turned the backup watchdog off.
- `pages-queued-workflow-fix` — A stuck Pages deploy needs a new commit, not a re-run.
- `favicon-is-a-different-drawing` — The favicon is redrawn, not the master shrunk.
- `icon-paths-and-export-gotchas` — Icon paths stay relative, and iOS caches hard.
- `masthead-is-not-project-name` — The masthead is not the project name.
- `main-moves-only-by-pr` — Main moves only by pull request, admins included.
- `screens-checked-headless-in-ci` — Each view is checked headless at 375 and 760px.
- `records-hold-current-text-only` — Records hold current text only; git keeps history.
- `debts-hold-known-gaps` — Known gaps and to-dos live in debts, one file each.
- `records-name-what-dates-them` — Each decision names the fact that would date it.
- `readme-is-minimal` — The README is minimal, and carries no license.
- `orchestrator-may-merge` — One orchestrating session batches and merges green, reviewed PRs.
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
- `testing-deps-caught-by-edit` — A missing dependency shows only on an edit.
- `testing-partial-qty-needs-case` — Assignment needs a partial-quantity case.
- `claims-and-tests-change-together` — A changed behaviour changes its test in one commit.
- `newer-features-test-proof-only` — Newer features have only test proof.

## Reference

A fact an agent needs, that argues nothing. Read the CSV record before touching the parser.

- `assets-and-icons` — Icon files and how to export them.
- `build-and-deploy` — Build, test and deploy commands, and `ios-ship testflight`.
- `harness-boot-seeds-remote-late` — Boot seeds the remote after the mount.
- `harness-drives-resume-by-event` — Drive a resume by event, not by waiting.
- `harness-drives-the-controls` — Tests drive the controls by their labels.
- `harness-drop-feeds-the-csv` — Tests feed files through the drop handler.
- `harness-jsdom-setup-gotchas` — The harness supplies what jsdom lacks.
- `harness-push-race-one-shot` — A push conflict needs a one-shot failure.
- `harness-waits-past-debounces` — Tests wait past the debounces.
- `live-verification` — What has run against real GitHub, a real device or a Worker probe.
- `orderwand-csv` — The OrderWand CSV schema and quirks.

## Open threads

A question this repo has not closed, or a risk it accepted on purpose. Each record carries a status.

- `a-host-migration-resets-storage` — A host migration resets phone storage.
- `auto-apply-happens-now` — A remote reply applies as soon as no press is in progress.
- `ci-runs-in-utc` — CI runs the suite outside UTC, so test 38.9 runs there.
- `itp-may-clear-storage` — ITP may clear storage after seven idle days.
- `nothing-recovers-without-the-key` — Nothing recovers without the key.
- `photos-in-git-are-permanent` — Photos are permanent in git and in the Worker.
- `ledger-private-source-public` — The ledger repo is private, the source repo is public.
- `token-expires-without-warning` — The token expires with no warning.
- `token-sits-on-shared-origin` — The token sits on a shared origin.
- `the-token-used-to-span-two-repos` — The token used to span two repositories.
- `watchdog-lives-in-private-repo` — Retired with the backup watchdog. Its placement rule stays.
- `the-write-budget-is-shared` — The write budget is shared with the ledger push.
- `vendor-toggle-undecided` — The vendor toggle stays undecided.
- `merge-later-change-wins` — Clock skew can pin a merge key. Accepted risk.

## Debts

One known gap or to-do per file under `docs/debts/`. Each carries a Status line and a Decision line that names its record or says none.

- `seed-in-public-history` — The seed stays in git history, deferred by the owner.
- `claim-11-fixed-edge-taps` — Claim 11 skips taps at a fixed control's edge.
- `chip-gap-tolerance-at-12px` — The chip-gap tolerance needs a 12px re-measure.
- `claim-9-fractional-box-edges` — Claim 9 can pass a box just under 44px.
- `tally-card-moves-at-320px` — The Tally card moves 14px at 320px.
- `native-ui-tests-not-in-ci` — Native UI tests and builds are not in CI.
- `native-sync-live-unrun` — The native sync client has never run against the Worker.
- `native-sync-glue-unpinned` — No test drives the native sync glue in the app.
- `native-merge-notice-unbuilt` — No native screen shows the merge notice.
- `native-pull-generation-unpinned` — No test pins the generation check in a pull.
- `native-kept-copy-has-no-route` — The native app has no route to the kept copy.
- `key-re-accepts-token-shape` — The key check accepts a GitHub token's shape.
- `tests-33-35-40-45-cannot-fail` — Tests 33.35, 33.40 and 33.45 cannot fail.
- `received-at-size-unmeasured` — The size of receivedAt is unmeasured.
- `suite-hang-cause-unmeasured` — The 13-minute hang after the suite summary is unexplained.
- `card-action-row-unmeasured` — The action row at its tallest state is unmeasured.
- `card-eleven-px-step-unmeasured` — The 11px row step at 320px is unmeasured.
- `reset-leaves-sync-unpinned` — No test pins that an armed Reset leaves Sync open.
- `reset-all-keeps-token-unpinned` — No test pins that resetAll keeps the GitHub token.
- `token-state-and-bundle-unpinned` — Nothing pins the token's React-state or bundle guarantees.
- `reimport-received-unpinned` — Nothing pins that received survives a re-import.
- `native-dialog-ban-unpinned` — Nothing pins the ban on native dialogs.
- `ruled-head-heights-unremeasured` — The ruled head heights have not been re-measured.
- `photo-put-unrun-on-github` — The GitHub photo PUT and pull have never run.
- `tally-audit-contrast-flags` — The Tally audit flags contrast and inaccessible text that the token pairs clear.
- `web-armed-restore-moves` — The web armed Restore moves under the pointer.
- `native-restore-pill-tap-unpinned` — No test taps the leading part of the native Restore pill.
- `native-ledger-tab-unbuilt` — The native Ledger tab lacks the View group.
- `native-restore-keeps-old-times` — A native restore keeps the old change times.
- `reset-vs-worker-copy-unmeasured` — A Reset's effect on the Worker's copy is unmeasured.
- `native-milestone-needed-unpinned` — No test pins that a native operation needs its milestone.
- `native-ask-has-no-cancel-focus` — The native ask does not move first focus to Cancel.
- `native-removal-rule-is-swift` — The test for a removing reply is Swift code.
- `native-version-names-unpinned` — No test pins the version file names.
- `native-filters-tally-only` — The native client has no date filter, package sort or Packages search.
- `native-tally-copy-no-flags` — The native Tally copy has no lost-mail flag and no order id tap.
- `native-envelope-has-no-photos` — Native envelopes have no photos.
- `native-orphaned-colours-unbuilt` — The native Orphaned composer audits flag text with no element.
- `native-candidate-lines-wrap` — Native candidate seller and meta lines wrap.
- `native-undo-notice-padding` — The native Undo notice pads 4pt, not 8pt.
- `native-composer-fields-two-lines` — The native composer fields draw two lines tall.
- `native-discard-arm-unpinned` — No test pins the native Discard arm.
- `native-key-scan-skips-views` — The native key scan skips SwiftUI view state.
- `native-compose-is-one-fade` — The native letterhead composes in one fade.
- `native-card-lost-flags-unbuilt` — The native package card has no lost-mail flag and no tracked glyph.
- `native-seller-scale-unmeasured` — The native seller shrinks to half size, and the cause is unmeasured.
- `native-pinned-card-dynamic-type` — The pinned-head audit flags Dynamic Type on one card.
- `native-cold-launch-ledger-shift` — The Ledger tab may jump at cold launch.
- `native-masthead-foot-row-gap` — The native masthead foot's second row sits 4.6pt low.
- `native-masthead-axl-clips` — The native masthead wraps and clips at accessibility text sizes.
- `native-stamp-load-unmeasured` — The native Packages load with stamps is unmeasured.
- `native-armed-audit-misses-ask` — The native armed stamp audit cannot see the ask.
- `hand-stamp-leaves-tally-stale` — A stamp from Card in Hand leaves Tally stale.
- `hand-reads-stamped-filter-rows` — Card in Hand reads the stamped filter's rows.
- `debt-notes` — One-line findings not likely in normal work.
- `native-card-gestures-unpinned` — No UI test pins the native card header gestures.
- `native-card-state-in-swift` — The native card copies the line and package done rules in Swift.
- `native-sync-tally-rules-in-swift` — The native Sync panel and Tally row copy six view rules in Swift.
- `native-backup-has-no-photos` — Native Backup holds no photos.
- `native-backup-ui-unpinned` — No UI test taps Backup.
- `native-backup-web-restore-unrun` — No test restores a native backup file on the web.
- `native-count-line-clips` — The native count line clips with no ellipsis at 4-digit counts.
- `native-masthead-stale-after-tabs` — The native masthead and Packages go stale after another tab writes.
- `draft-skip-required-unmeasured` — A required check on a draft-skipped job is unmeasured.
- `recent-log-unbuilt` — The recent-actions log is not built.
- `recent-log-unmeasured` — The recent-actions log has three measurements to take.
- `armed-reset-mistap-unmeasured` — A mis-tap beside the armed Reset box is unmeasured.
- `orphaned-reach-unpinned` — Re-import, Backup and Reset on Orphaned have no test.
- `native-ledger-pins-missing` — Four native ledger behaviours have no test.
- `panels-overlay-unbuilt` — Disclosure panels still push the list.
- `panel-paper-fill-unbuilt` — Overlay panels carry no paper fill.
- `order-id-visible-unbuilt` — The Tally order id has no narrow-width rule.
- `tcgplayer-link-opens-history-list` — The TCGplayer link may not search by order id.
- `header-gestures-unmeasured` — Header gestures are unmeasured.
- `ios-touch-adjust-unmeasured` — iOS touch adjustment near the order id link is unmeasured.
- `discard-keeps-draft` — Discard does not end a composer draft.
- `type-floor-unbuilt` — Some labels are below the 10px floor.
- `universal-link-unbuilt` — The universal-link key fallback is not built.
- `native-runner-image-unverified` — Whether the hosted runner image has Xcode 27 and xcodegen is unverified.
- `native-runner-keychain-unverified` — Whether the hosted runner keychain is unlocked is unverified.
- `native-job-hosted-time-unmeasured` — The native job's time on a hosted runner is unmeasured.
- `native-photo-screens-unwired` — No native screen shows a photo, and nothing takes one.
- `native-photo-ids-kept-uncalled` — The native restore does not call the photo id rule.
- `native-merge-skips-photo-fetch` — Nothing fetches native photos before an apply.
- `native-photo-sweep-unbuilt` — The native client has no photo sweep.
- `native-photo-viewer-unpinned` — No test pins the photo viewer's traits or the Stop control.
- `n11-device-check-not-run` — The owner's native device check has not run.
- `web-photos-have-no-backup` — No Worker snapshot covers a web photo.
- `web-reads-no-worker-snapshots` — Web History reads no Worker snapshot.
- `cloudflare-access-login-untested` — A Cloudflare Access login in an iOS home-screen app is untested.
- `backup-unwatched` — No alarm watches the backup after the watchdog is off.
- `worker-two-device-proof-unrun` — The two-device merge is not proven against the Worker.
- `sweep-settle-masks-30-13-stall` — The SWEEP_WAIT settle after 19.6 hides a stall at 30.13.
- `photoget-throw-counts-as-kill` — A throw counts as a kill in the photoGet test.
- `lost-photo-clock-is-envelope-age` — The lost-photo clock runs from envelope age.
- `lost-tile-waits-for-first-post` — The lost tile waits for the first POST.
- `failed-photo-download-no-retry` — A failed photo download is not retried.
- `half-open-socket-has-no-ping` — A half-open socket has no ping.
- `hidden-tab-apply-delay-unmeasured` — The apply delay on a hidden tab is unmeasured.
- `sync-latency-after-fix-unmeasured` — The sync delay with the press guard is unmeasured.
- `screens-45px-width-flake` — The screens check once measured every target 45px wide.
- `tracking-checker-unbuilt` — A future checker that passively checks tracking numbers. It blocks nothing.
- `orders-job-unbuilt` — The Worker orders cron, its key test and its status screen are unbuilt.
- `duo-keyboard-gap-unmeasured` — The Duo keyboard gap above the keys is unmeasured.
- `duo-fold-change-unpinned` — No test folds the Duo while the app runs.
- `duo-tab-items-twice` — The Duo tab bar repeats the tab titles in RootView.
- `duo-bar-dynamic-type-clips` — The Duo tab bar may clip at large text sizes.
- `duo-stacked-poses-unbuilt` — The Duo has no stacked poses.
- `duo-hand-mockup-gaps` — Eight parts of the Card in Hand mockup are not built.
- `hand-checkin-error-hidden` — A failed check-in in Card in Hand shows nowhere.
- `hand-stray-keeps-tie` — A released card leaves its tie on the answer page.
- `hand-post-scroll-hides-sender` — The Post offer scrolls the sender off the page.
- `hand-notice-cuts-match-row` — A Suspense or Released box pushes the match under the keys.
- `hand-suspense-tap-shift` — A Suspense tap shifts the match list under the finger.
- `duo-left-page-dead-margin` — The Duo left page scrolls 76 pt past its end.
- `duo-checkin-error-under-bar` — A Packages check-in error can sit under the Duo bar.
- `native-tally-ellipsis-unpinned` — Nothing pins the native Tally ellipsis.
- `native-discard-panel-covers-head` — The native armed Discard panel covers the envelope header.
- `native-axl-rows-break` — Three native rows break at accessibility text sizes.
- `sim-test-diagnose-and-pin` — sim-test runs simctl diagnose and can pick the Duo.

## Measurements

Each figure was measured in a real viewport or on a real device. A test cannot hold most of them, and each record says how to take the number again.

- `card-reserved-geometry` — Card reserved geometry heights.
- `duo-fold-and-keyboard` — Fold strip, keyboard frame and outer screen on the iPhone Duo simulator.
- `ledger-and-seed-sizes` — Ledger and version sizes.
- `masthead-foot-slot` — Masthead foot save-slot width.
- `motion-timings` — Motion sheet durations and beats.
- `native-card-load-time` — Native Packages load time on 600 packages.
- `palette-contrast` — Palette token contrast ratios.
- `ruled-head-heights` — Ruled head control region heights.
- `suite-size` — Test suite assertion count and run time.
- `switch-thirds-and-seal` — View switch, seal, and tally headroom.
- `sync-latency` — Sync delay from a tap on one device to the row on the other.

## Build and deploy

```
npm install
npm run build          # -> index.html
npm test               # the behaviour suite
npm run check:build    # is the committed index.html this repo's code?
npm run check:seed     # does the built page carry any ledger data?
npm run check:docs     # do this file's numbers and paths hold?
npm run check:records  # does the record corpus hold together?
npm run deploy         # build, test, then open a pull request
npm run serve          # a local server on :4173
ios-ship testflight tools/ios-ship.json --app Manifest  # iOS: Release archive, then upload to TestFlight
```

The steps and the traps live in `build-and-deploy`. Main moves by pull request
only, so `deploy` opens one rather than pushing.
