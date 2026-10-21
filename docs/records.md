# Records index

This page lists every record in this repo: the rules in `CLAUDE.md`, and the files in `decisions/`, `debts/` and `plans/`. A script writes it. Do not edit it by hand.

The merge tool writes this page again when a pull request merges, so a pull request need not carry a fresh one. To write it by hand, run `python3 lint/hook_catalog.py` from the claude-settings checkout, with `--root` set to this repo. The check on the default branch fails when the page is stale.

Each row has the slug, the first sentence of the record, and a link to it. A record that a ruling overrules is rewritten in place, so no row holds old text.

## Rulings

| Slug | Gist | Link |
|---|---|---|
| `auto-apply-happens-now` | Kind: process | [`decisions/auto-apply-happens-now.md`](../decisions/auto-apply-happens-now.md) |
| `auto-push-safe-as-merge-exists` | **Status:** retired 2026-10-14. | [`decisions/auto-push-safe-as-merge-exists.md`](../decisions/auto-push-safe-as-merge-exists.md) |
| `data-branch-setup` | The `data` branch in `mailaudit-data` already exists. | [`decisions/data-branch-setup.md`](../decisions/data-branch-setup.md) |
| `debts-hold-known-gaps` | Each known gap or to-do is one file under `debts/`, and each file names the decision it belongs to. | [`decisions/debts-hold-known-gaps.md`](../decisions/debts-hold-known-gaps.md) |
| `history-sync-close-each-other` | Kind: process | [`decisions/history-sync-close-each-other.md`](../decisions/history-sync-close-each-other.md) |
| `ledger-and-photos-share-a-repo` | The private repo `mailaudit-data` holds the frozen ledger history on branch `data`. | [`decisions/ledger-and-photos-share-a-repo.md`](../decisions/ledger-and-photos-share-a-repo.md) |
| `ledger-tab-holds-options` | Kind: process | [`decisions/ledger-tab-holds-options.md`](../decisions/ledger-tab-holds-options.md) |
| `merge-carries-no-two-tap-arm` | Kind: process | [`decisions/merge-carries-no-two-tap-arm.md`](../decisions/merge-carries-no-two-tap-arm.md) |
| `native-files-are-frozen` | Kind: process | [`decisions/native-files-are-frozen.md`](../decisions/native-files-are-frozen.md) |
| `newer-features-test-proof-only` | Kind: process | [`decisions/newer-features-test-proof-only.md`](../decisions/newer-features-test-proof-only.md) |
| `older-versions-come-off-branch` | Every push before the switch created a commit, so the frozen `data` branch holds a full archive of past ledgers. | [`decisions/older-versions-come-off-branch.md`](../decisions/older-versions-come-off-branch.md) |
| `peek-is-three-valued` | **Status:** retired 2026-10-14. | [`decisions/peek-is-three-valued.md`](../decisions/peek-is-three-valued.md) |
| `photo-branch-must-preexist` | Photos lived on the `main` branch of `mailaudit-data`, in `photos/`. | [`decisions/photo-branch-must-preexist.md`](../decisions/photo-branch-must-preexist.md) |
| `photo-errors-never-hit-pushstate` | Kind: process | [`decisions/photo-errors-never-hit-pushstate.md`](../decisions/photo-errors-never-hit-pushstate.md) |
| `photo-writes-wait-one-second` | **Status:** retired 2026-10-14. | [`decisions/photo-writes-wait-one-second.md`](../decisions/photo-writes-wait-one-second.md) |
| `push-and-merge-guard-differently` | **Status:** retired 2026-10-14. | [`decisions/push-and-merge-guard-differently.md`](../decisions/push-and-merge-guard-differently.md) |
| `push-flash-waits-for-photos` | Kind: process | [`decisions/push-flash-waits-for-photos.md`](../decisions/push-flash-waits-for-photos.md) |
| `pushforce-sha-only-after-write` | **Status:** retired 2026-10-14. | [`decisions/pushforce-sha-only-after-write.md`](../decisions/pushforce-sha-only-after-write.md) |
| `records-hold-current-text-only` | A record states what is true now, in the fewest words. | [`decisions/records-hold-current-text-only.md`](../decisions/records-hold-current-text-only.md) |
| `ruled-head-hand-elapsed-forward` | **Status:** retired 2026-10-14. | [`decisions/ruled-head-hand-elapsed-forward.md`](../decisions/ruled-head-hand-elapsed-forward.md) |
| `stale-push-conflict-pull-two-tap` | **Status:** retired 2026-10-14. | [`decisions/stale-push-conflict-pull-two-tap.md`](../decisions/stale-push-conflict-pull-two-tap.md) |
| `sync-runs-itself` | Sync runs itself, and there is no toggle. | [`decisions/sync-runs-itself.md`](../decisions/sync-runs-itself.md) |
| `testing-unfailable-assert-decor` | Kind: process | [`decisions/testing-unfailable-assert-decor.md`](../decisions/testing-unfailable-assert-decor.md) |
| `two-device-merge-proven-first` | **Status:** retired 2026-10-14. | [`decisions/two-device-merge-proven-first.md`](../decisions/two-device-merge-proven-first.md) |
| `watchdog-catches-silent-failure` | **Status:** retired. | [`decisions/watchdog-catches-silent-failure.md`](../decisions/watchdog-catches-silent-failure.md) |
| `watchdog-lives-in-private-repo` | **Status:** retired. | [`decisions/watchdog-lives-in-private-repo.md`](../decisions/watchdog-lives-in-private-repo.md) |

## Build designs

| Slug | Gist | Link |
|---|---|---|
| `a-restore-is-not-local` | Restoring a version rewrites `items`, `received` and `envelopes`. | [`decisions/a-restore-is-not-local.md`](../decisions/a-restore-is-not-local.md) |
| `armed-reset-takes-the-row` | Reset is red text at rest, in its own box at the end of the Ledger tab. | [`decisions/armed-reset-takes-the-row.md`](../decisions/armed-reset-takes-the-row.md) |
| `b64-fails-with-plausible-data` | The base64 helpers for the Contents API get their own file, `src/b64.mjs`. | [`decisions/b64-fails-with-plausible-data.md`](../decisions/b64-fails-with-plausible-data.md) |
| `build-and-deploy` | Kind: build | [`decisions/build-and-deploy.md`](../decisions/build-and-deploy.md) |
| `card-tally-row-counts-first` | At iPhone width, the Tally row is tight. | [`decisions/card-tally-row-counts-first.md`](../decisions/card-tally-row-counts-first.md) |
| `card-the-bar-is-out-of-flow` | Kind: build | [`decisions/card-the-bar-is-out-of-flow.md`](../decisions/card-the-bar-is-out-of-flow.md) |
| `check-build-ignores-seed` | Kind: build | [`decisions/check-build-ignores-seed.md`](../decisions/check-build-ignores-seed.md) |
| `check-seed-backstop-not-proof` | Kind: build | [`decisions/check-seed-backstop-not-proof.md`](../decisions/check-seed-backstop-not-proof.md) |
| `ci-filters-guarantee-no-rebuild` | Nothing the app writes should touch the source repository, so a backup can never trigger a site rebuild. | [`decisions/ci-filters-guarantee-no-rebuild.md`](../decisions/ci-filters-guarantee-no-rebuild.md) |
| `ci-skips-draft-prs` | Kind: build | [`decisions/ci-skips-draft-prs.md`](../decisions/ci-skips-draft-prs.md) |
| `ledger-remote-needed-for-seed` | Kind: build | [`decisions/ledger-remote-needed-for-seed.md`](../decisions/ledger-remote-needed-for-seed.md) |
| `live-verification` | This file draws the line between proven and unproven. | [`decisions/live-verification.md`](../decisions/live-verification.md) |
| `merge-later-change-wins` | Kind: build | [`decisions/merge-later-change-wins.md`](../decisions/merge-later-change-wins.md) |
| `motion-disclosure-panels-arrive` | A disclosure panel overlays the list. | [`decisions/motion-disclosure-panels-arrive.md`](../decisions/motion-disclosure-panels-arrive.md) |
| `native-build-lanes` | **Status:** ruled. | [`decisions/native-build-lanes.md`](../decisions/native-build-lanes.md) |
| `native-ci-on-hosted-macos` | **Status:** ruled. | [`decisions/native-ci-on-hosted-macos.md`](../decisions/native-ci-on-hosted-macos.md) |
| `native-key-via-url-scheme` | **Status:** ruled. | [`decisions/native-key-via-url-scheme.md`](../decisions/native-key-via-url-scheme.md) |
| `native-ledger-is-raw-json` | Kind: build | [`decisions/native-ledger-is-raw-json.md`](../decisions/native-ledger-is-raw-json.md) |
| `native-parity-table` | Kind: build | [`decisions/native-parity-table.md`](../decisions/native-parity-table.md) |
| `native-swift-rebuild` | Kind: build | [`decisions/native-swift-rebuild.md`](../decisions/native-swift-rebuild.md) |
| `order-id-button-stops-propagate` | The order-id button in Tally stops its click from reaching the row underneath. | [`decisions/order-id-button-stops-propagate.md`](../decisions/order-id-button-stops-propagate.md) |
| `orphan-entry-takes-one-input` | The Orphaned view records an envelope from one input. | [`decisions/orphan-entry-takes-one-input.md`](../decisions/orphan-entry-takes-one-input.md) |
| `photo-ids-restore-keep-if-known` | Owner ruling 2026-10-15 21:25 CDT. | [`decisions/photo-ids-restore-keep-if-known.md`](../decisions/photo-ids-restore-keep-if-known.md) |
| `photo-ids-unreadable-local` | An unreadable local photo store keeps every id, exactly as an unreadable remote one does. | [`decisions/photo-ids-unreadable-local.md`](../decisions/photo-ids-unreadable-local.md) |
| `photos-in-git-are-permanent` | **Status:** open. | [`decisions/photos-in-git-are-permanent.md`](../decisions/photos-in-git-are-permanent.md) |
| `pull-fetches-photos-before-apply` | A held Worker reply fetches the photos it names before it applies the ledger. | [`decisions/pull-fetches-photos-before-apply.md`](../decisions/pull-fetches-photos-before-apply.md) |
| `pull-warns-on-what-it-drops` | Owner ruling 2026-10-17: the app warns about a lost label photo after a grace period. | [`decisions/pull-warns-on-what-it-drops.md`](../decisions/pull-warns-on-what-it-drops.md) |
| `recent-checks-can-be-undone` | **Status:** ruled. | [`decisions/recent-checks-can-be-undone.md`](../decisions/recent-checks-can-be-undone.md) |
| `recovery-control-not-state-gated` | If the data an action works on is absent, its recovery control must not hide. | [`decisions/recovery-control-not-state-gated.md`](../decisions/recovery-control-not-state-gated.md) |
| `remote-is-transport-not-storage` | `window.remote` is transport, not storage. | [`decisions/remote-is-transport-not-storage.md`](../decisions/remote-is-transport-not-storage.md) |
| `ruled-head-one-advisory-entrance` | Kind: build | [`decisions/ruled-head-one-advisory-entrance.md`](../decisions/ruled-head-one-advisory-entrance.md) |
| `ruled-head-panels-carry-no-fill` | **Status:** orchestrator default, 2026-10-11, not built. | [`decisions/ruled-head-panels-carry-no-fill.md`](../decisions/ruled-head-panels-carry-no-fill.md) |
| `rules-run-in-javascriptcore` | **Status:** ruled. | [`decisions/rules-run-in-javascriptcore.md`](../decisions/rules-run-in-javascriptcore.md) |
| `screens-checked-headless-in-ci` | Each view (Ledger tab, Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px. | [`decisions/screens-checked-headless-in-ci.md`](../decisions/screens-checked-headless-in-ci.md) |
| `seed-load-guards` | Kind: build | [`decisions/seed-load-guards.md`](../decisions/seed-load-guards.md) |
| `spacing-on-4px-grid` | Kind: build | [`decisions/spacing-on-4px-grid.md`](../decisions/spacing-on-4px-grid.md) |
| `sync-revamp-cloudflare` | Kind: build | [`decisions/sync-revamp-cloudflare.md`](../decisions/sync-revamp-cloudflare.md) |
| `the-public-seed` | Kind: build | [`decisions/the-public-seed.md`](../decisions/the-public-seed.md) |
| `three-views-share-one-switch` | The bottom bar replaces the top view switch at every width (`phone-nav-is-bottom-bar`). | [`decisions/three-views-share-one-switch.md`](../decisions/three-views-share-one-switch.md) |
| `typography-cochin-and-mono` | Cochin sets everything that is not a number. | [`decisions/typography-cochin-and-mono.md`](../decisions/typography-cochin-and-mono.md) |
| `ux-house-rules-govern` | The owner ruled on 2026-10-11: "apply the latest from claude settings' ux guidelines, along with /design-review /ci-hygiene /fresh-prose". | [`decisions/ux-house-rules-govern.md`](../decisions/ux-house-rules-govern.md) |
| `worker-keeps-snapshots` | **Status:** ruled. | [`decisions/worker-keeps-snapshots.md`](../decisions/worker-keeps-snapshots.md) |

## Unsorted decisions

| Slug | Gist | Link |
|---|---|---|
| `a-host-migration-resets-storage` | **Status:** open. | [`decisions/a-host-migration-resets-storage.md`](../decisions/a-host-migration-resets-storage.md) |
| `a-refund-leaves-every-count` | A package stamped `Refunded` or `Partial refund` drops out of every count and the normal package list. | [`decisions/a-refund-leaves-every-count.md`](../decisions/a-refund-leaves-every-count.md) |
| `a-reveal-ignores-hidedone-too` | A revealed package must ignore `hideDone` as well as the search `query`. | [`decisions/a-reveal-ignores-hidedone-too.md`](../decisions/a-reveal-ignores-hidedone-too.md) |
| `action-row-is-ruled-cells` | **Status:** retired in L11b, commit `12e8721`. | [`decisions/action-row-is-ruled-cells.md`](../decisions/action-row-is-ruled-cells.md) |
| `anchor-is-the-earliest-record` | Each hour and each day keeps its earliest version. | [`decisions/anchor-is-the-earliest-record.md`](../decisions/anchor-is-the-earliest-record.md) |
| `anchors-are-derived-not-stored` | No version carries a stored "hourly" or "daily" kind. | [`decisions/anchors-are-derived-not-stored.md`](../decisions/anchors-are-derived-not-stored.md) |
| `assets-and-icons` | This file holds where the icon assets live, where the master and the generator sit, and the exact export commands. | [`decisions/assets-and-icons.md`](../decisions/assets-and-icons.md) |
| `assign-checks-recorded-cards` | A one-tap assign checks in exactly the cards recorded in an envelope. | [`decisions/assign-checks-recorded-cards.md`](../decisions/assign-checks-recorded-cards.md) |
| `backup-files-restore-two-ways` | A local backup downloads one JSON file. | [`decisions/backup-files-restore-two-ways.md`](../decisions/backup-files-restore-two-ways.md) |
| `canceled-orders-leave-the-list` | A canceled order leaves the list. | [`decisions/canceled-orders-leave-the-list.md`](../decisions/canceled-orders-leave-the-list.md) |
| `candidates-skip-date-filter` | Each pending envelope lists the outstanding packages that could explain it. | [`decisions/candidates-skip-date-filter.md`](../decisions/candidates-skip-date-filter.md) |
| `card-the-action-row-is-reserved` | The action row's buttons change on the same tap that changes the card. | [`decisions/card-the-action-row-is-reserved.md`](../decisions/card-the-action-row-is-reserved.md) |
| `ci-runs-in-utc` | **Status:** open. | [`decisions/ci-runs-in-utc.md`](../decisions/ci-runs-in-utc.md) |
| `claims-and-tests-change-together` | A behaviour that changes on purpose changes its assertion and its prose in one commit. | [`decisions/claims-and-tests-change-together.md`](../decisions/claims-and-tests-change-together.md) |
| `cost-basis-excludes-ship-and-tax` | **Cost basis** = Σ (Price × Quantity) over the item's non-canceled copies in the active date range. | [`decisions/cost-basis-excludes-ship-and-tax.md`](../decisions/cost-basis-excludes-ship-and-tax.md) |
| `csv-import-shows-a-summary` | A CSV import works by drag and drop, or by the file picker. | [`decisions/csv-import-shows-a-summary.md`](../decisions/csv-import-shows-a-summary.md) |
| `csv-import-stays-web` | **Status:** ruled. | [`decisions/csv-import-stays-web.md`](../decisions/csv-import-stays-web.md) |
| `date-filter-spans-ledger-views` | The date filter applies to the Tally view and the Packages view. | [`decisions/date-filter-spans-ledger-views.md`](../decisions/date-filter-spans-ledger-views.md) |
| `design-form-controls-no-inherit` | Browsers force their own UI font onto `button`, `input`, `select` and `textarea`. | [`decisions/design-form-controls-no-inherit.md`](../decisions/design-form-controls-no-inherit.md) |
| `design-parchment-ledger` | The theme is named "Parchment ledger" (palette D▸, Violet Evergarden–inspired). | [`decisions/design-parchment-ledger.md`](../decisions/design-parchment-ledger.md) |
| `design-view-switch-equal-thirds` | **Retired:** L11a removed the view switch at every width. | [`decisions/design-view-switch-equal-thirds.md`](../decisions/design-view-switch-equal-thirds.md) |
| `disclosure-cells-underline-value` | The two cells that open something underline their value. | [`decisions/disclosure-cells-underline-value.md`](../decisions/disclosure-cells-underline-value.md) |
| `envelope-deletion-unrepresented` | **Status:** closed, by the `deletedAt` tombstone (`sync-revamp-cloudflare`). | [`decisions/envelope-deletion-unrepresented.md`](../decisions/envelope-deletion-unrepresented.md) |
| `envelope-names-match-normname` | Names typed into an envelope match ledger names only after both pass through `normName`. | [`decisions/envelope-names-match-normname.md`](../decisions/envelope-names-match-normname.md) |
| `every-origin-has-own-storage` | The file protocol, the local server, and the live Pages site are three separate origins: `file://`, `http://localhost:4173` and `https://shivinate7.github.io`. | [`decisions/every-origin-has-own-storage.md`](../decisions/every-origin-has-own-storage.md) |
| `every-restore-passes-applybackup` | The file restore and the GitHub pull both pass through one function, `applyBackup()`. | [`decisions/every-restore-passes-applybackup.md`](../decisions/every-restore-passes-applybackup.md) |
| `favicon-is-a-different-drawing` | A browser tab renders the favicon at 16 CSS px. | [`decisions/favicon-is-a-different-drawing.md`](../decisions/favicon-is-a-different-drawing.md) |
| `file-protocol-works-locally` | Opening `index.html` straight off disk works. | [`decisions/file-protocol-works-locally.md`](../decisions/file-protocol-works-locally.md) |
| `fine-grained-token-single-repo` | Each device gets its own named fine-grained personal access token. | [`decisions/fine-grained-token-single-repo.md`](../decisions/fine-grained-token-single-repo.md) |
| `harness-boot-seeds-remote-late` | `boot()` seeds `opts.remote` after the app mounts. | [`decisions/harness-boot-seeds-remote-late.md`](../decisions/harness-boot-seeds-remote-late.md) |
| `harness-drives-resume-by-event` | Tests drive auto-push and the resume by dispatching events. | [`decisions/harness-drives-resume-by-event.md`](../decisions/harness-drives-resume-by-event.md) |
| `harness-drives-the-controls` | The ruled head replaced the native select and the chip disclosures. | [`decisions/harness-drives-the-controls.md`](../decisions/harness-drives-the-controls.md) |
| `harness-drop-feeds-the-csv` | Tests feed a file to the app through its drop handler. | [`decisions/harness-drop-feeds-the-csv.md`](../decisions/harness-drop-feeds-the-csv.md) |
| `harness-jsdom-setup-gotchas` | The harness boots the app inside jsdom. | [`decisions/harness-jsdom-setup-gotchas.md`](../decisions/harness-jsdom-setup-gotchas.md) |
| `harness-push-race-one-shot` | `remote.fail` cannot express a push that conflicts. | [`decisions/harness-push-race-one-shot.md`](../decisions/harness-push-race-one-shot.md) |
| `harness-waits-past-debounces` | Two app timers settle after the next line of a test runs. | [`decisions/harness-waits-past-debounces.md`](../decisions/harness-waits-past-debounces.md) |
| `history-restores-a-saved-version` | The History panel lists saved versions, newest first. | [`decisions/history-restores-a-saved-version.md`](../decisions/history-restores-a-saved-version.md) |
| `hourly-tier-closes-the-gap` | The ring keeps the newest 20 non-milestone versions. | [`decisions/hourly-tier-closes-the-gap.md`](../decisions/hourly-tier-closes-the-gap.md) |
| `icon-paths-and-export-gotchas` | Both icon `href`s must stay relative. | [`decisions/icon-paths-and-export-gotchas.md`](../decisions/icon-paths-and-export-gotchas.md) |
| `invariants-cited-by-slug` | A record or a code comment cites an invariant by its slug, such as `parser-filters`, and never by a number. | [`decisions/invariants-cited-by-slug.md`](../decisions/invariants-cited-by-slug.md) |
| `itp-may-clear-storage` | **Status:** open. | [`decisions/itp-may-clear-storage.md`](../decisions/itp-may-clear-storage.md) |
| `label-photos-downscale-to-2000px` | An envelope photo is a snap of the mailing label. | [`decisions/label-photos-downscale-to-2000px.md`](../decisions/label-photos-downscale-to-2000px.md) |
| `ledger-private-source-public` | **Status:** open. | [`decisions/ledger-private-source-public.md`](../decisions/ledger-private-source-public.md) |
| `listphotos-is-three-valued` | `listPhotos()` answers in one of two shapes: `{known:true, ids}` or `{known:false, reason}`. | [`decisions/listphotos-is-three-valued.md`](../decisions/listphotos-is-three-valued.md) |
| `lost-mail-flags-use-order-date` | An untracked, unreceived package gets an amber "may be lost" flag at 14d from the order date. | [`decisions/lost-mail-flags-use-order-date.md`](../decisions/lost-mail-flags-use-order-date.md) |
| `main-moves-only-by-pr` | Every change reaches `main` through a pull request that passes the required `suite` check. | [`decisions/main-moves-only-by-pr.md`](../decisions/main-moves-only-by-pr.md) |
| `masthead-is-not-project-name` | The app presents itself as **MANIFEST**, under a C.H Postal Company letterhead. | [`decisions/masthead-is-not-project-name.md`](../decisions/masthead-is-not-project-name.md) |
| `masthead-is-one-letterhead` | The top of the page is one composed letterhead, not stacked boxes. | [`decisions/masthead-is-one-letterhead.md`](../decisions/masthead-is-one-letterhead.md) |
| `masthead-running-head-sticky` | The slim running head is `position: sticky` with a fixed height. | [`decisions/masthead-running-head-sticky.md`](../decisions/masthead-running-head-sticky.md) |
| `masthead-save-slot-reserved` | The tally footer holds `N packages · autosaves`, the exact `N still missing · $X`, and the debounced save indicator. | [`decisions/masthead-save-slot-reserved.md`](../decisions/masthead-save-slot-reserved.md) |
| `masthead-sizing-by-clamp` | Every size in the masthead is set with `clamp()`. | [`decisions/masthead-sizing-by-clamp.md`](../decisions/masthead-sizing-by-clamp.md) |
| `masthead-tallies-unequal-thirds` | The tallies are three ruled cells: cards, packages, and value. | [`decisions/masthead-tallies-unequal-thirds.md`](../decisions/masthead-tallies-unequal-thirds.md) |
| `max-cannot-express-an-uncheck` | **Status:** closed, by the `receivedAt` change (`sync-revamp-cloudflare`). | [`decisions/max-cannot-express-an-uncheck.md`](../decisions/max-cannot-express-an-uncheck.md) |
| `merge-is-the-primary-sync-action` | **Status:** retired 2026-10-12. | [`decisions/merge-is-the-primary-sync-action.md`](../decisions/merge-is-the-primary-sync-action.md) |
| `merge-readopts-sync-generation` | `applyBackup` increments `syncGen`. | [`decisions/merge-readopts-sync-generation.md`](../decisions/merge-readopts-sync-generation.md) |
| `milestones-taken-before-risk` | The version store keeps four tiers. | [`decisions/milestones-taken-before-risk.md`](../decisions/milestones-taken-before-risk.md) |
| `motion-a-card-opens-in-order` | Opening a card reveals the bulk row first. | [`decisions/motion-a-card-opens-in-order.md`](../decisions/motion-a-card-opens-in-order.md) |
| `motion-collapse-not-animated` | Closing a card happens at once, with no exit animation. | [`decisions/motion-collapse-not-animated.md`](../decisions/motion-collapse-not-animated.md) |
| `motion-completed-package-gilded` | Finishing a package draws one pass of gold across the card. | [`decisions/motion-completed-package-gilded.md`](../decisions/motion-completed-package-gilded.md) |
| `motion-letterhead-composes-once` | The masthead builds itself once per load, in the order a page is made: wax, rules, name, house, figures. | [`decisions/motion-letterhead-composes-once.md`](../decisions/motion-letterhead-composes-once.md) |
| `motion-masthead-bar-sweeps-once` | The masthead progress bar takes its green a beat after its width lands. | [`decisions/motion-masthead-bar-sweeps-once.md`](../decisions/motion-masthead-bar-sweeps-once.md) |
| `motion-method-side-by-side-proof` | Every moment in the motion design was built two or three ways, as a side-by-side proof sheet. | [`decisions/motion-method-side-by-side-proof.md`](../decisions/motion-method-side-by-side-proof.md) |
| `motion-nothing-may-reflow` | Every keyframe touches only opacity, transform, colour, or box-shadow. | [`decisions/motion-nothing-may-reflow.md`](../decisions/motion-nothing-may-reflow.md) |
| `motion-reduced-leaves-it-drawn` | Turning off animation must never hide anything. | [`decisions/motion-reduced-leaves-it-drawn.md`](../decisions/motion-reduced-leaves-it-drawn.md) |
| `motion-remeasure-not-rereason` | Settle motion claims by measuring, not by reading. | [`decisions/motion-remeasure-not-rereason.md`](../decisions/motion-remeasure-not-rereason.md) |
| `motion-stationery-not-software` | Every motion in the app must feel like paper and ink. | [`decisions/motion-stationery-not-software.md`](../decisions/motion-stationery-not-software.md) |
| `motion-the-check-tick-is-written` | The check tick draws as one stroke, from left to right. | [`decisions/motion-the-check-tick-is-written.md`](../decisions/motion-the-check-tick-is-written.md) |
| `motion-the-stamp-lands` | The stamp rocks down and settles at its resting angle, instead of blinking into place. | [`decisions/motion-the-stamp-lands.md`](../decisions/motion-the-stamp-lands.md) |
| `motion-the-switch-is-one-object` | The ruling: the active-view fill is a single element that slides between thirds. | [`decisions/motion-the-switch-is-one-object.md`](../decisions/motion-the-switch-is-one-object.md) |
| `motion-use-just-became` | Every celebration marks a state that a package can already be in. | [`decisions/motion-use-just-became.md`](../decisions/motion-use-just-became.md) |
| `native-reply-waits-generation` | **Status:** ruled. | [`decisions/native-reply-waits-generation.md`](../decisions/native-reply-waits-generation.md) |
| `nothing-recovers-without-the-key` | **Status:** open. | [`decisions/nothing-recovers-without-the-key.md`](../decisions/nothing-recovers-without-the-key.md) |
| `null-remote-info-is-not-no-key` | A null `remoteInfo` means that the status has not loaded yet. | [`decisions/null-remote-info-is-not-no-key.md`](../decisions/null-remote-info-is-not-no-key.md) |
| `offline-is-decided-by-fetch` | The app decides `offline` only by a failed `fetch`, and by nothing else. | [`decisions/offline-is-decided-by-fetch.md`](../decisions/offline-is-decided-by-fetch.md) |
| `one-repo-for-both-halves` | The source repository, `mailaudit`, is public and holds no data. | [`decisions/one-repo-for-both-halves.md`](../decisions/one-repo-for-both-halves.md) |
| `one-stamp-per-package` | Each package holds at most one order stamp. | [`decisions/one-stamp-per-package.md`](../decisions/one-stamp-per-package.md) |
| `orchestrator-may-merge` | The owner granted standing merge authority on 2026-10-10. | [`decisions/orchestrator-may-merge.md`](../decisions/orchestrator-may-merge.md) |
| `orderwand-csv` | This record holds the CSV column list and every quirk found in the user's real OrderWand exports. | [`decisions/orderwand-csv.md`](../decisions/orderwand-csv.md) |
| `orphan-sweep-drops-unused-photos` | One sweep effect covers every path that orphans a photo. | [`decisions/orphan-sweep-drops-unused-photos.md`](../decisions/orphan-sweep-drops-unused-photos.md) |
| `orphaned-colours-by-meaning` | Orphaned uses the app's colour meanings. | [`decisions/orphaned-colours-by-meaning.md`](../decisions/orphaned-colours-by-meaning.md) |
| `outstanding-value-per-level` | The app states what is still outstanding at three levels: the whole ledger, each package and each Tally item. | [`decisions/outstanding-value-per-level.md`](../decisions/outstanding-value-per-level.md) |
| `package-sort-swaps-with-view` | The Packages view has its own sort, separate from the Tally sort. | [`decisions/package-sort-swaps-with-view.md`](../decisions/package-sort-swaps-with-view.md) |
| `packages-group-by-order-seller` | The Packages view groups lines by order and seller. | [`decisions/packages-group-by-order-seller.md`](../decisions/packages-group-by-order-seller.md) |
| `pages-queued-workflow-fix` | GitHub Pages serves the site from the main branch root. | [`decisions/pages-queued-workflow-fix.md`](../decisions/pages-queued-workflow-fix.md) |
| `palette-gold-is-ornament-only` | The `gold` token is ornament only. | [`decisions/palette-gold-is-ornament-only.md`](../decisions/palette-gold-is-ornament-only.md) |
| `palette-inksoft-and-manilaink` | The `inkSoft` token was darkened. | [`decisions/palette-inksoft-and-manilaink.md`](../decisions/palette-inksoft-and-manilaink.md) |
| `palette-silver-stays-cool` | The `silver` token was chosen on looks, not on legibility. | [`decisions/palette-silver-stays-cool.md`](../decisions/palette-silver-stays-cool.md) |
| `palette-theme-color-tracks-paper` | The `theme-color` value in `build.mjs` and the `<style>` page background both track the `paper` token (`#F2E9DA`). | [`decisions/palette-theme-color-tracks-paper.md`](../decisions/palette-theme-color-tracks-paper.md) |
| `palette-tokens-contrast-floor` | The app defines one fixed set of color tokens, each with a named role. | [`decisions/palette-tokens-contrast-floor.md`](../decisions/palette-tokens-contrast-floor.md) |
| `phone-nav-is-bottom-bar` | The owner ruled on 2026-10-11: "bottom bar D is gorgeous! | [`decisions/phone-nav-is-bottom-bar.md`](../decisions/phone-nav-is-bottom-bar.md) |
| `photo-rules-fails-quietly` | The photo-sync rules live in `src/photo-rules.mjs`. | [`decisions/photo-rules-fails-quietly.md`](../decisions/photo-rules-fails-quietly.md) |
| `photo-sweep-two-guards` | The photo sweep deletes blobs that no envelope or draft references. | [`decisions/photo-sweep-two-guards.md`](../decisions/photo-sweep-two-guards.md) |
| `photo-sync-cannot-conflict` | Photo sync is a set difference over ids. | [`decisions/photo-sync-cannot-conflict.md`](../decisions/photo-sync-cannot-conflict.md) |
| `photo-thumbnails-and-viewer` | Photo thumbnails are 56px squares. | [`decisions/photo-thumbnails-and-viewer.md`](../decisions/photo-thumbnails-and-viewer.md) |
| `photos-stay-out-of-the-ledger` | Envelope photos live in IndexedDB. | [`decisions/photos-stay-out-of-the-ledger.md`](../decisions/photos-stay-out-of-the-ledger.md) |
| `progress-bar-accent-then-green` | The progress bar fills with accent violet while it is in progress. | [`decisions/progress-bar-accent-then-green.md`](../decisions/progress-bar-accent-then-green.md) |
| `pull-needs-a-key-too` | Push needs a fine-grained personal access token. | [`decisions/pull-needs-a-key-too.md`](../decisions/pull-needs-a-key-too.md) |
| `readme-is-minimal` | The public repo has a short README. | [`decisions/readme-is-minimal.md`](../decisions/readme-is-minimal.md) |
| `records-name-what-dates-them` | Every decision record carries one line that starts with "**Holds while:**". | [`decisions/records-name-what-dates-them.md`](../decisions/records-name-what-dates-them.md) |
| `remote-rules-fail-quietly` | Two adapter decisions get their own pure functions, in `src/remote-rules.mjs`. | [`decisions/remote-rules-fail-quietly.md`](../decisions/remote-rules-fail-quietly.md) |
| `remote-sync-is-off-the-save-path` | The local save runs on its own debounced path, with a 500ms debounce and a saved or saving indicator. | [`decisions/remote-sync-is-off-the-save-path.md`](../decisions/remote-sync-is-off-the-save-path.md) |
| `retention-tiers-are-unioned` | A saved version survives a prune when any one of four rules keeps it. | [`decisions/retention-tiers-are-unioned.md`](../decisions/retention-tiers-are-unioned.md) |
| `ruled-head-masthead-vocabulary` | The control region uses the masthead's own vocabulary. | [`decisions/ruled-head-masthead-vocabulary.md`](../decisions/ruled-head-masthead-vocabulary.md) |
| `ruled-head-range-picked` | The custom range uses a month picker. | [`decisions/ruled-head-range-picked.md`](../decisions/ruled-head-range-picked.md) |
| `ruled-head-resume-is-reopening` | An iOS home-screen app is usually backgrounded, not closed. | [`decisions/ruled-head-resume-is-reopening.md`](../decisions/ruled-head-resume-is-reopening.md) |
| `ruled-head-showing-unreceived` | The Showing row replaces the old "Hide received" button. | [`decisions/ruled-head-showing-unreceived.md`](../decisions/ruled-head-showing-unreceived.md) |
| `ruled-head-stale-clock-agreement` | The staleness clock is the last time this device agreed with the Worker. | [`decisions/ruled-head-stale-clock-agreement.md`](../decisions/ruled-head-stale-clock-agreement.md) |
| `search-filters-inside-package` | A search filters inside a package. | [`decisions/search-filters-inside-package.md`](../decisions/search-filters-inside-package.md) |
| `search-hide-keep-tally-counts` | Search and hide-received filter the copy breakdown under a Tally item. | [`decisions/search-hide-keep-tally-counts.md`](../decisions/search-hide-keep-tally-counts.md) |
| `sha-accepted-only-after-apply` | The app stores the remote sha only after it applies the pulled bytes. | [`decisions/sha-accepted-only-after-apply.md`](../decisions/sha-accepted-only-after-apply.md) |
| `shared-origin-needs-namespace` | `shivinate7.github.io` is a single origin across every repo the user has on Pages. | [`decisions/shared-origin-needs-namespace.md`](../decisions/shared-origin-needs-namespace.md) |
| `shared-tokens-and-fixtures` | **Status:** ruled. | [`decisions/shared-tokens-and-fixtures.md`](../decisions/shared-tokens-and-fixtures.md) |
| `shrunk-envelope-gets-fresh-stamp` | A partial assignment leaves some entries behind, so the envelope shrinks. | [`decisions/shrunk-envelope-gets-fresh-stamp.md`](../decisions/shrunk-envelope-gets-fresh-stamp.md) |
| `single-file-architecture` | The whole application lives in one React component file, `src/app.jsx`. | [`decisions/single-file-architecture.md`](../decisions/single-file-architecture.md) |
| `stamp-band-opens-the-editor` | A stamp shows as a band under the package header. | [`decisions/stamp-band-opens-the-editor.md`](../decisions/stamp-band-opens-the-editor.md) |
| `stamp-removal-writes-a-tombstone` | Removing an order stamp writes a tombstone value instead of deleting the entry. | [`decisions/stamp-removal-writes-a-tombstone.md`](../decisions/stamp-removal-writes-a-tombstone.md) |
| `stamped-filter-on-the-pipeline` | The `N stamped` cell filters the Packages view to stamped packages. | [`decisions/stamped-filter-on-the-pipeline.md`](../decisions/stamped-filter-on-the-pipeline.md) |
| `stamped-package-hides-lost-flag` | Any stamped package hides the lost-mail warning. | [`decisions/stamped-package-hides-lost-flag.md`](../decisions/stamped-package-hides-lost-flag.md) |
| `storage-split-three-adapters` | The application component (`app.jsx`) never calls localStorage or IndexedDB itself. | [`decisions/storage-split-three-adapters.md`](../decisions/storage-split-three-adapters.md) |
| `sync-line-toggles-its-panel` | The sync line renders when sync is broken or the panel is open. | [`decisions/sync-line-toggles-its-panel.md`](../decisions/sync-line-toggles-its-panel.md) |
| `sync-panel-is-two-column-grid` | The sync panel has no option grid. | [`decisions/sync-panel-is-two-column-grid.md`](../decisions/sync-panel-is-two-column-grid.md) |
| `sync-particulars-ruled-values` | The particulars under the sync grid are the head cells' two parts, laid on their side. | [`decisions/sync-particulars-ruled-values.md`](../decisions/sync-particulars-ruled-values.md) |
| `tally-pools-on-the-exact-name` | The Tally view pools line items by *exact* Product Name, across every seller and order. | [`decisions/tally-pools-on-the-exact-name.md`](../decisions/tally-pools-on-the-exact-name.md) |
| `tally-row-lists-its-copies` | A collapsed Tally row shows `got/ordered`, the unit rate, the outstanding figure, the seller and order counts, and the sets involved. | [`decisions/tally-row-lists-its-copies.md`](../decisions/tally-row-lists-its-copies.md) |
| `tally-sort-keys-are-six` | The Tally view sorts its rows on six keys. | [`decisions/tally-sort-keys-are-six.md`](../decisions/tally-sort-keys-are-six.md) |
| `testing-check-something-rereads` | Changing a value an adapter owns tests nothing unless a component reads it again. | [`decisions/testing-check-something-rereads.md`](../decisions/testing-check-something-rereads.md) |
| `testing-chokepoint-two-branches` | A shared chokepoint can have two read paths. | [`decisions/testing-chokepoint-two-branches.md`](../decisions/testing-chokepoint-two-branches.md) |
| `testing-deps-caught-by-edit` | A memo that omits a dependency stays hidden while the memo re-runs for other reasons. | [`decisions/testing-deps-caught-by-edit.md`](../decisions/testing-deps-caught-by-edit.md) |
| `testing-green-suite-hides-break` | A fully passing suite proved nothing about the single most important scenario. | [`decisions/testing-green-suite-hides-break.md`](../decisions/testing-green-suite-hides-break.md) |
| `testing-isolate-each-tier` | When several rules can each keep or drop the same record, a test on one rule must neutralize every other rule first. | [`decisions/testing-isolate-each-tier.md`](../decisions/testing-isolate-each-tier.md) |
| `testing-jsdom-has-no-layout` | A jsdom suite cannot see width, shift, or truncation. | [`decisions/testing-jsdom-has-no-layout.md`](../decisions/testing-jsdom-has-no-layout.md) |
| `testing-mock-field-stops-decor` | A mock field that nothing reads can stay wrong for a long time, without harm. | [`decisions/testing-mock-field-stops-decor.md`](../decisions/testing-mock-field-stops-decor.md) |
| `testing-mock-is-test-below-seam` | Below the seam an app-level test cannot reach, the mock stands in for the real defect. | [`decisions/testing-mock-is-test-below-seam.md`](../decisions/testing-mock-is-test-below-seam.md) |
| `testing-mutant-dies-check-cause` | A mutant dying does not prove the intended assertion caught it. | [`decisions/testing-mutant-dies-check-cause.md`](../decisions/testing-mutant-dies-check-cause.md) |
| `testing-partial-qty-needs-case` | Every assignment in groups 1 to 19 takes a card's full quantity. | [`decisions/testing-partial-qty-needs-case.md`](../decisions/testing-partial-qty-needs-case.md) |
| `testing-pull-payload-eq-void` | A pull makes the local ledger identical to the remote one. | [`decisions/testing-pull-payload-eq-void.md`](../decisions/testing-pull-payload-eq-void.md) |
| `testing-surviving-mutant` | A surviving mutant shows that the fixtures never reach the state where the bug matters. | [`decisions/testing-surviving-mutant.md`](../decisions/testing-surviving-mutant.md) |
| `testing-throwing-assert-bad-kill` | A test that throws on a mutant is worse than one that fails cleanly. | [`decisions/testing-throwing-assert-bad-kill.md`](../decisions/testing-throwing-assert-bad-kill.md) |
| `the-token-used-to-span-two-repos` | **Status:** closed, by the `mailaudit-data` move. | [`decisions/the-token-used-to-span-two-repos.md`](../decisions/the-token-used-to-span-two-repos.md) |
| `the-write-budget-is-shared` | **Status:** open. | [`decisions/the-write-budget-is-shared.md`](../decisions/the-write-budget-is-shared.md) |
| `token-expires-without-warning` | **Status:** open. | [`decisions/token-expires-without-warning.md`](../decisions/token-expires-without-warning.md) |
| `token-field-is-sixteen-pixels` | The sync key field is set at 16px. | [`decisions/token-field-is-sixteen-pixels.md`](../decisions/token-field-is-sixteen-pixels.md) |
| `token-lives-outside-namespace` | The GitHub access token lives at the raw localStorage key `mailday-remote:v1`. | [`decisions/token-lives-outside-namespace.md`](../decisions/token-lives-outside-namespace.md) |
| `token-sits-on-shared-origin` | **Status:** open. | [`decisions/token-sits-on-shared-origin.md`](../decisions/token-sits-on-shared-origin.md) |
| `undo-removes-only-its-delta` | Undo keeps the deltas of an assignment, not a snapshot of the ledger. | [`decisions/undo-removes-only-its-delta.md`](../decisions/undo-removes-only-its-delta.md) |
| `unit-rate-is-not-the-position` | The collapsed Tally row shows the **unit rate**, not the basis. | [`decisions/unit-rate-is-not-the-position.md`](../decisions/unit-rate-is-not-the-position.md) |
| `unwritable-store-says-so` | When IndexedDB cannot be written, every version save must fail visibly. | [`decisions/unwritable-store-says-so.md`](../decisions/unwritable-store-says-so.md) |
| `upload-zone-opens-when-empty` | The upload zone opens when the user asks for it. | [`decisions/upload-zone-opens-when-empty.md`](../decisions/upload-zone-opens-when-empty.md) |
| `vendor-toggle-undecided` | **Status:** open. | [`decisions/vendor-toggle-undecided.md`](../decisions/vendor-toggle-undecided.md) |
| `versions-get-their-own-database` | `window.versions` is a separate IndexedDB database. | [`decisions/versions-get-their-own-database.md`](../decisions/versions-get-their-own-database.md) |

## Debts

| Slug | Gist | Link |
|---|---|---|
| `armed-reset-mistap-unmeasured` | A mis-tap on a control next to the armed Reset box is unmeasured, and so is the width of the armed row. | [`debts/armed-reset-mistap-unmeasured.md`](../debts/armed-reset-mistap-unmeasured.md) |
| `backup-unwatched` | Once the watchdog is off, no check reads the Worker's snapshots or the `data` branch, so a stopped backup raises no alarm. | [`debts/backup-unwatched.md`](../debts/backup-unwatched.md) |
| `card-action-row-unmeasured` | The action row's content need at its tallest state is not measured at `f97e423`. | [`debts/card-action-row-unmeasured.md`](../debts/card-action-row-unmeasured.md) |
| `card-eleven-px-step-unmeasured` | At `1607933` the three-button state was not reproduced, so the 11px row step at 320px is unmeasured at the grid head. | [`debts/card-eleven-px-step-unmeasured.md`](../debts/card-eleven-px-step-unmeasured.md) |
| `chip-gap-tolerance-at-12px` | The 12px chip gap is not re-measured. | [`debts/chip-gap-tolerance-at-12px.md`](../debts/chip-gap-tolerance-at-12px.md) |
| `claim-11-fixed-edge-taps` | Claim 11 of `check:screens` does not test a tap just past a fixed control's edge, where the tap lands on scrolling content, or the reverse. | [`debts/claim-11-fixed-edge-taps.md`](../debts/claim-11-fixed-edge-taps.md) |
| `claim-9-fractional-box-edges` | A 43.5px box reads as 44px, so claim 9 can pass a box just under 44px. | [`debts/claim-9-fractional-box-edges.md`](../debts/claim-9-fractional-box-edges.md) |
| `cloudflare-access-login-untested` | Whether the backup sign-in survives in an iOS home-screen app has not been run on a device. | [`debts/cloudflare-access-login-untested.md`](../debts/cloudflare-access-login-untested.md) |
| `discard-keeps-draft` | `discardEnvelope` in `src/app.jsx` never clears the draft. | [`debts/discard-keeps-draft.md`](../debts/discard-keeps-draft.md) |
| `draft-skip-required-unmeasured` | It is unmeasured how a required check reads a job that the draft guard skipped. | [`debts/draft-skip-required-unmeasured.md`](../debts/draft-skip-required-unmeasured.md) |
| `failed-photo-download-no-retry` | When a merge's photo download fails, the id stays in the ledger and the tile stays blank. | [`debts/failed-photo-download-no-retry.md`](../debts/failed-photo-download-no-retry.md) |
| `key-re-accepts-token-shape` | A GitHub token uses only letters, digits and underscores, so the key check accepts a token as a key. | [`debts/key-re-accepts-token-shape.md`](../debts/key-re-accepts-token-shape.md) |
| `lost-photo-clock-is-envelope-age` | The 7-day lost-photo clock runs from the envelope's `createdAt`. | [`debts/lost-photo-clock-is-envelope-age.md`](../debts/lost-photo-clock-is-envelope-age.md) |
| `lost-tile-waits-for-first-post` | The lost tile shows only after the push survey that follows a successful POST. | [`debts/lost-tile-waits-for-first-post.md`](../debts/lost-tile-waits-for-first-post.md) |
| `n10-photos-unbuilt` | Lane N10 is ruled in `native-build-lanes`, and it is not built. | [`debts/n10-photos-unbuilt.md`](../debts/n10-photos-unbuilt.md) |
| `n11-device-check-not-run` | Lane N11 is the owner's check on a device, as ruled in `native-build-lanes`, and it has not run. | [`debts/n11-device-check-not-run.md`](../debts/n11-device-check-not-run.md) |
| `n4a-sync-over-http-unbuilt` | No sync source exists under `native/` on main. | [`debts/n4a-sync-over-http-unbuilt.md`](../debts/n4a-sync-over-http-unbuilt.md) |
| `n4b-socket-idle-gate-unbuilt` | Lane N4b is ruled in `native-build-lanes`, and it is not built. | [`debts/n4b-socket-idle-gate-unbuilt.md`](../debts/n4b-socket-idle-gate-unbuilt.md) |
| `native-dialog-ban-unpinned` | Nothing pins the ban on `window.confirm` and `alert` itself. | [`debts/native-dialog-ban-unpinned.md`](../debts/native-dialog-ban-unpinned.md) |
| `native-discard-arm-unpinned` | No test pins the native Discard ask. | [`debts/native-discard-arm-unpinned.md`](../debts/native-discard-arm-unpinned.md) |
| `native-envelope-has-no-photos` | The native Orphaned view shows no photo and has no capture control. | [`debts/native-envelope-has-no-photos.md`](../debts/native-envelope-has-no-photos.md) |
| `native-job-hosted-time-unmeasured` | The 8 to 15 minute estimate for the full native job is unmeasured. | [`debts/native-job-hosted-time-unmeasured.md`](../debts/native-job-hosted-time-unmeasured.md) |
| `native-kept-copy-has-no-route` | No native view opens the kept copy, and no lane records a route to it. | [`debts/native-kept-copy-has-no-route.md`](../debts/native-kept-copy-has-no-route.md) |
| `native-key-scan-skips-views` | No lane scans SwiftUI view state. | [`debts/native-key-scan-skips-views.md`](../debts/native-key-scan-skips-views.md) |
| `native-lanes-n6-to-n9-unbuilt` | `native/` holds no Tally, backup or milestone view on main. | [`debts/native-lanes-n6-to-n9-unbuilt.md`](../debts/native-lanes-n6-to-n9-unbuilt.md) |
| `native-ledger-pins-missing` | No test pins the millisecond kept-name format, the missing-file case, or the unwrapped-error sentence in Load and save. | [`debts/native-ledger-pins-missing.md`](../debts/native-ledger-pins-missing.md) |
| `native-ledger-tab-unbuilt` | No lane builds the options that `ledger-tab-holds-options` puts in the Ledger tab. | [`debts/native-ledger-tab-unbuilt.md`](../debts/native-ledger-tab-unbuilt.md) |
| `native-orphaned-colours-unbuilt` | `native/Manifest/OrphanedView.swift` paints with system styles. | [`debts/native-orphaned-colours-unbuilt.md`](../debts/native-orphaned-colours-unbuilt.md) |
| `native-runner-image-unverified` | Whether the `macos-26` runner image has Xcode 27 and xcodegen is unknown. | [`debts/native-runner-image-unverified.md`](../debts/native-runner-image-unverified.md) |
| `native-runner-keychain-unverified` | Whether the runner keychain is unlocked is unknown. | [`debts/native-runner-keychain-unverified.md`](../debts/native-runner-keychain-unverified.md) |
| `native-ui-tests-not-in-ci` | The native job runs the ST tests only, so native UI tests and builds are not in CI. | [`debts/native-ui-tests-not-in-ci.md`](../debts/native-ui-tests-not-in-ci.md) |
| `order-id-visible-unbuilt` | What counts as visible at narrow widths is not defined. | [`debts/order-id-visible-unbuilt.md`](../debts/order-id-visible-unbuilt.md) |
| `orphaned-reach-unpinned` | No test pins that Re-import, Backup and Reset must stay reachable from Orphaned, and it is unverified. | [`debts/orphaned-reach-unpinned.md`](../debts/orphaned-reach-unpinned.md) |
| `panel-paper-fill-unbuilt` | Overlay panels carry no `paper` fill: `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. | [`debts/panel-paper-fill-unbuilt.md`](../debts/panel-paper-fill-unbuilt.md) |
| `panels-overlay-unbuilt` | Today a panel takes layout space and pushes the list down. | [`debts/panels-overlay-unbuilt.md`](../debts/panels-overlay-unbuilt.md) |
| `photo-put-unrun-on-github` | `pushPhoto` and `pullPhoto` on `window.remote` (`src/entry.jsx`) have never run against real GitHub. | [`debts/photo-put-unrun-on-github.md`](../debts/photo-put-unrun-on-github.md) |
| `photoget-throw-counts-as-kill` | In `test/photoget.test.mjs`, `runCase` turns a throw into a red case, and a red case counts as a mutant kill. | [`debts/photoget-throw-counts-as-kill.md`](../debts/photoget-throw-counts-as-kill.md) |
| `received-at-size-unmeasured` | `receivedAt` is never pruned, and its size has not been measured. | [`debts/received-at-size-unmeasured.md`](../debts/received-at-size-unmeasured.md) |
| `recent-log-unbuilt` | The log, its merge rule, its panel and its undo are ruled and not built, in either client. | [`debts/recent-log-unbuilt.md`](../debts/recent-log-unbuilt.md) |
| `recent-log-unmeasured` | Four figures are unmeasured. | [`debts/recent-log-unmeasured.md`](../debts/recent-log-unmeasured.md) |
| `reimport-received-unpinned` | Nothing pins that `received` survives a re-import. | [`debts/reimport-received-unpinned.md`](../debts/reimport-received-unpinned.md) |
| `reset-all-keeps-token-unpinned` | No test pins that `resetAll` keeps the GitHub token. | [`debts/reset-all-keeps-token-unpinned.md`](../debts/reset-all-keeps-token-unpinned.md) |
| `reset-leaves-sync-unpinned` | No test pins that an armed Reset leaves Sync open. | [`debts/reset-leaves-sync-unpinned.md`](../debts/reset-leaves-sync-unpinned.md) |
| `ruled-head-heights-unremeasured` | The figures under "Grid head figures" come from the round-1 builder, and the records writer did not re-measure them. | [`debts/ruled-head-heights-unremeasured.md`](../debts/ruled-head-heights-unremeasured.md) |
| `seed-in-public-history` | The seed is readable in `index.html` history from `10f9499` to the commit before `82e45d4`, and erasing it needs a history rewrite and the owner's word. | [`debts/seed-in-public-history.md`](../debts/seed-in-public-history.md) |
| `suite-hang-cause-unmeasured` | The cause of the 13-minute hang is unmeasured, and so are the exit codes of the UTC and machine-zone runs. | [`debts/suite-hang-cause-unmeasured.md`](../debts/suite-hang-cause-unmeasured.md) |
| `sweep-settle-masks-30-13-stall` | The `SWEEP_WAIT` settle after 19.6 hides a stall at 30.13, and it does not explain it. | [`debts/sweep-settle-masks-30-13-stall.md`](../debts/sweep-settle-masks-30-13-stall.md) |
| `tally-card-moves-at-320px` | At 320px the Tally card moves 14px on check-ins 1 and 6. | [`debts/tally-card-moves-at-320px.md`](../debts/tally-card-moves-at-320px.md) |
| `tests-33-35-40-45-cannot-fail` | Tests 33.35, 33.40 and 33.45 cannot fail on a plausible mutant. | [`debts/tests-33-35-40-45-cannot-fail.md`](../debts/tests-33-35-40-45-cannot-fail.md) |
| `token-export-and-view-unpinned` | Nothing yet pins the native device key in the backup export or in SwiftUI view state. | [`debts/token-export-and-view-unpinned.md`](../debts/token-export-and-view-unpinned.md) |
| `token-state-and-bundle-unpinned` | Nothing pins the React-state or bundle guarantees. | [`debts/token-state-and-bundle-unpinned.md`](../debts/token-state-and-bundle-unpinned.md) |
| `type-floor-unbuilt` | Some labels are smaller than the 10px floor today. | [`debts/type-floor-unbuilt.md`](../debts/type-floor-unbuilt.md) |
| `universal-link-unbuilt` | Neither the link handler nor the Worker route that serves the apple-app-site-association file exists. | [`debts/universal-link-unbuilt.md`](../debts/universal-link-unbuilt.md) |
| `web-photos-have-no-backup` | Web photos go to the Worker's `/photos` route. | [`debts/web-photos-have-no-backup.md`](../debts/web-photos-have-no-backup.md) |
| `web-reads-no-worker-snapshots` | Web does not read the Worker `/snapshots` or `/kept` routes. | [`debts/web-reads-no-worker-snapshots.md`](../debts/web-reads-no-worker-snapshots.md) |
| `worker-two-device-proof-unrun` | No written proof runs two devices against the Worker merge, so the first real two-device case is unchecked. | [`debts/worker-two-device-proof-unrun.md`](../debts/worker-two-device-proof-unrun.md) |
