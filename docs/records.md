# Records index

This page lists every record in this repo: the rules in `CLAUDE.md`, and the files in `docs/decisions/`, `docs/debts/`, `docs/plans/`, `invariants/` and `measurements/`. A script writes it. Do not edit it by hand.

The merge tool writes this page again when a pull request merges, so a pull request need not carry a fresh one. To write it by hand, run `python3 lint/hook_catalog.py` from the claude-settings checkout, with `--root` set to this repo. The check on the default branch fails when the page is stale.

Each row has the slug, the first sentence of the record, and a link to it. A record that a ruling overrules is rewritten in place, so no row holds old text.

## Rulings

| Slug | Gist | Link |
|---|---|---|
| `auto-push-safe-as-merge-exists` | **Status:** retired 2026-10-14. | [`docs/decisions/auto-push-safe-as-merge-exists.md`](../docs/decisions/auto-push-safe-as-merge-exists.md) |
| `data-branch-setup` | The `data` branch in `mailaudit-data` already exists. | [`docs/decisions/data-branch-setup.md`](../docs/decisions/data-branch-setup.md) |
| `debts-hold-known-gaps` | Each known gap is one file under `docs/debts/`, with a Status line and a Decision line. | [`docs/decisions/debts-hold-known-gaps.md`](../docs/decisions/debts-hold-known-gaps.md) |
| `history-sync-close-each-other` | Kind: process | [`docs/decisions/history-sync-close-each-other.md`](../docs/decisions/history-sync-close-each-other.md) |
| `ledger-and-photos-share-a-repo` | The private repo `mailaudit-data` holds the frozen ledger history on branch `data`. | [`docs/decisions/ledger-and-photos-share-a-repo.md`](../docs/decisions/ledger-and-photos-share-a-repo.md) |
| `ledger-tab-holds-options` | Kind: process | [`docs/decisions/ledger-tab-holds-options.md`](../docs/decisions/ledger-tab-holds-options.md) |
| `merge-carries-no-two-tap-arm` | Kind: process | [`docs/decisions/merge-carries-no-two-tap-arm.md`](../docs/decisions/merge-carries-no-two-tap-arm.md) |
| `native-files-are-frozen` | Kind: process | [`docs/decisions/native-files-are-frozen.md`](../docs/decisions/native-files-are-frozen.md) |
| `newer-features-test-proof-only` | Kind: process | [`docs/decisions/newer-features-test-proof-only.md`](../docs/decisions/newer-features-test-proof-only.md) |
| `older-versions-come-off-branch` | Every push before the switch created a commit, so the frozen `data` branch holds a full archive of past ledgers. | [`docs/decisions/older-versions-come-off-branch.md`](../docs/decisions/older-versions-come-off-branch.md) |
| `one-simulator-per-mac` | Kind: process | [`docs/decisions/one-simulator-per-mac.md`](../docs/decisions/one-simulator-per-mac.md) |
| `peek-is-three-valued` | **Status:** retired 2026-10-14. | [`docs/decisions/peek-is-three-valued.md`](../docs/decisions/peek-is-three-valued.md) |
| `photo-branch-must-preexist` | Photos lived on the `main` branch of `mailaudit-data`, in `photos/`. | [`docs/decisions/photo-branch-must-preexist.md`](../docs/decisions/photo-branch-must-preexist.md) |
| `photo-errors-never-hit-pushstate` | Kind: process | [`docs/decisions/photo-errors-never-hit-pushstate.md`](../docs/decisions/photo-errors-never-hit-pushstate.md) |
| `photo-writes-wait-one-second` | **Status:** retired 2026-10-14. | [`docs/decisions/photo-writes-wait-one-second.md`](../docs/decisions/photo-writes-wait-one-second.md) |
| `push-and-merge-guard-differently` | **Status:** retired 2026-10-14. | [`docs/decisions/push-and-merge-guard-differently.md`](../docs/decisions/push-and-merge-guard-differently.md) |
| `push-flash-waits-for-photos` | Kind: process | [`docs/decisions/push-flash-waits-for-photos.md`](../docs/decisions/push-flash-waits-for-photos.md) |
| `pushforce-sha-only-after-write` | **Status:** retired 2026-10-14. | [`docs/decisions/pushforce-sha-only-after-write.md`](../docs/decisions/pushforce-sha-only-after-write.md) |
| `records-hold-current-text-only` | A record states what is true now, in the fewest words. | [`docs/decisions/records-hold-current-text-only.md`](../docs/decisions/records-hold-current-text-only.md) |
| `ruled-head-hand-elapsed-forward` | **Status:** retired 2026-10-14. | [`docs/decisions/ruled-head-hand-elapsed-forward.md`](../docs/decisions/ruled-head-hand-elapsed-forward.md) |
| `stale-push-conflict-pull-two-tap` | **Status:** retired 2026-10-14. | [`docs/decisions/stale-push-conflict-pull-two-tap.md`](../docs/decisions/stale-push-conflict-pull-two-tap.md) |
| `sync-runs-itself` | Sync runs itself, and there is no toggle. | [`docs/decisions/sync-runs-itself.md`](../docs/decisions/sync-runs-itself.md) |
| `testing-unfailable-assert-decor` | Kind: process | [`docs/decisions/testing-unfailable-assert-decor.md`](../docs/decisions/testing-unfailable-assert-decor.md) |
| `two-device-merge-proven-first` | **Status:** retired 2026-10-14. | [`docs/decisions/two-device-merge-proven-first.md`](../docs/decisions/two-device-merge-proven-first.md) |
| `watchdog-catches-silent-failure` | **Status:** retired. | [`docs/decisions/watchdog-catches-silent-failure.md`](../docs/decisions/watchdog-catches-silent-failure.md) |
| `watchdog-lives-in-private-repo` | **Status:** retired. | [`docs/decisions/watchdog-lives-in-private-repo.md`](../docs/decisions/watchdog-lives-in-private-repo.md) |

## Build designs

| Slug | Gist | Link |
|---|---|---|
| `a-restore-is-not-local` | Restoring a version rewrites `items`, `received` and `envelopes`. | [`docs/decisions/a-restore-is-not-local.md`](../docs/decisions/a-restore-is-not-local.md) |
| `armed-reset-takes-the-row` | Reset is red text at rest, in its own box at the end of the Ledger tab. | [`docs/decisions/armed-reset-takes-the-row.md`](../docs/decisions/armed-reset-takes-the-row.md) |
| `auto-apply-happens-now` | Kind: build | [`docs/decisions/auto-apply-happens-now.md`](../docs/decisions/auto-apply-happens-now.md) |
| `b64-fails-with-plausible-data` | The base64 helpers for the Contents API get their own file, `src/b64.mjs`. | [`docs/decisions/b64-fails-with-plausible-data.md`](../docs/decisions/b64-fails-with-plausible-data.md) |
| `build-and-deploy` | Kind: build | [`docs/decisions/build-and-deploy.md`](../docs/decisions/build-and-deploy.md) |
| `card-tally-row-counts-first` | At iPhone width, the Tally row is tight. | [`docs/decisions/card-tally-row-counts-first.md`](../docs/decisions/card-tally-row-counts-first.md) |
| `card-the-bar-is-out-of-flow` | Kind: build | [`docs/decisions/card-the-bar-is-out-of-flow.md`](../docs/decisions/card-the-bar-is-out-of-flow.md) |
| `check-build-ignores-seed` | Kind: build | [`docs/decisions/check-build-ignores-seed.md`](../docs/decisions/check-build-ignores-seed.md) |
| `check-seed-backstop-not-proof` | Kind: build | [`docs/decisions/check-seed-backstop-not-proof.md`](../docs/decisions/check-seed-backstop-not-proof.md) |
| `ci-filters-guarantee-no-rebuild` | Nothing the app writes should touch the source repository, so a backup can never trigger a site rebuild. | [`docs/decisions/ci-filters-guarantee-no-rebuild.md`](../docs/decisions/ci-filters-guarantee-no-rebuild.md) |
| `ci-skips-draft-prs` | Kind: build | [`docs/decisions/ci-skips-draft-prs.md`](../docs/decisions/ci-skips-draft-prs.md) |
| `duo-card-in-hand` | Kind: build | [`docs/decisions/duo-card-in-hand.md`](../docs/decisions/duo-card-in-hand.md) |
| `ledger-remote-needed-for-seed` | Kind: build | [`docs/decisions/ledger-remote-needed-for-seed.md`](../docs/decisions/ledger-remote-needed-for-seed.md) |
| `live-verification` | This file draws the line between proven and unproven. | [`docs/decisions/live-verification.md`](../docs/decisions/live-verification.md) |
| `masthead-tallies-unequal-thirds` | The tallies are three ruled cells: cards, packages, and value. | [`docs/decisions/masthead-tallies-unequal-thirds.md`](../docs/decisions/masthead-tallies-unequal-thirds.md) |
| `merge-later-change-wins` | Kind: build | [`docs/decisions/merge-later-change-wins.md`](../docs/decisions/merge-later-change-wins.md) |
| `motion-disclosure-panels-arrive` | A disclosure panel overlays the list. | [`docs/decisions/motion-disclosure-panels-arrive.md`](../docs/decisions/motion-disclosure-panels-arrive.md) |
| `native-build-lanes` | **Status:** ruled. | [`docs/decisions/native-build-lanes.md`](../docs/decisions/native-build-lanes.md) |
| `native-ci-on-hosted-macos` | **Status:** ruled. | [`docs/decisions/native-ci-on-hosted-macos.md`](../docs/decisions/native-ci-on-hosted-macos.md) |
| `native-key-via-url-scheme` | **Status:** ruled. | [`docs/decisions/native-key-via-url-scheme.md`](../docs/decisions/native-key-via-url-scheme.md) |
| `native-ledger-is-raw-json` | Kind: build | [`docs/decisions/native-ledger-is-raw-json.md`](../docs/decisions/native-ledger-is-raw-json.md) |
| `native-parity-table` | Kind: build | [`docs/decisions/native-parity-table.md`](../docs/decisions/native-parity-table.md) |
| `native-reply-waits-generation` | Kind: build | [`docs/decisions/native-reply-waits-generation.md`](../docs/decisions/native-reply-waits-generation.md) |
| `native-ships-via-testflight` | After each merge, this Mac installs a Release build of MANIFEST on the owner's phone over Wi-Fi or cable. | [`docs/decisions/native-ships-via-testflight.md`](../docs/decisions/native-ships-via-testflight.md) |
| `native-swift-rebuild` | Kind: build | [`docs/decisions/native-swift-rebuild.md`](../docs/decisions/native-swift-rebuild.md) |
| `new-envelope-ends-an-envelope` | Kind: build | [`docs/decisions/new-envelope-ends-an-envelope.md`](../docs/decisions/new-envelope-ends-an-envelope.md) |
| `order-id-button-stops-propagate` | The order-id button in Tally stops its click from reaching the row underneath. | [`docs/decisions/order-id-button-stops-propagate.md`](../docs/decisions/order-id-button-stops-propagate.md) |
| `orphan-entry-takes-one-input` | The Orphaned view records an envelope from one input. | [`docs/decisions/orphan-entry-takes-one-input.md`](../docs/decisions/orphan-entry-takes-one-input.md) |
| `phone-nav-is-bottom-bar` | The owner ruled on 2026-10-11: "bottom bar D is gorgeous! | [`docs/decisions/phone-nav-is-bottom-bar.md`](../docs/decisions/phone-nav-is-bottom-bar.md) |
| `photo-ids-restore-keep-if-known` | Owner ruling 2026-10-15 21:25 CDT. | [`docs/decisions/photo-ids-restore-keep-if-known.md`](../docs/decisions/photo-ids-restore-keep-if-known.md) |
| `photo-ids-unreadable-local` | An unreadable local photo store keeps every id, exactly as an unreadable remote one does. | [`docs/decisions/photo-ids-unreadable-local.md`](../docs/decisions/photo-ids-unreadable-local.md) |
| `photos-in-git-are-permanent` | **Status:** open. | [`docs/decisions/photos-in-git-are-permanent.md`](../docs/decisions/photos-in-git-are-permanent.md) |
| `pull-fetches-photos-before-apply` | A held Worker reply fetches the photos it names before it applies the ledger. | [`docs/decisions/pull-fetches-photos-before-apply.md`](../docs/decisions/pull-fetches-photos-before-apply.md) |
| `pull-warns-on-what-it-drops` | Owner ruling 2026-10-17: the app warns about a lost label photo after a grace period. | [`docs/decisions/pull-warns-on-what-it-drops.md`](../docs/decisions/pull-warns-on-what-it-drops.md) |
| `recent-checks-can-be-undone` | **Status:** ruled. | [`docs/decisions/recent-checks-can-be-undone.md`](../docs/decisions/recent-checks-can-be-undone.md) |
| `recovery-control-not-state-gated` | If the data an action works on is absent, its recovery control must not hide. | [`docs/decisions/recovery-control-not-state-gated.md`](../docs/decisions/recovery-control-not-state-gated.md) |
| `remote-is-transport-not-storage` | `window.remote` is transport, not storage. | [`docs/decisions/remote-is-transport-not-storage.md`](../docs/decisions/remote-is-transport-not-storage.md) |
| `ruled-head-one-advisory-entrance` | Kind: build | [`docs/decisions/ruled-head-one-advisory-entrance.md`](../docs/decisions/ruled-head-one-advisory-entrance.md) |
| `ruled-head-panels-carry-no-fill` | **Status:** orchestrator default, 2026-10-11, not built. | [`docs/decisions/ruled-head-panels-carry-no-fill.md`](../docs/decisions/ruled-head-panels-carry-no-fill.md) |
| `rules-run-in-javascriptcore` | **Status:** ruled. | [`docs/decisions/rules-run-in-javascriptcore.md`](../docs/decisions/rules-run-in-javascriptcore.md) |
| `screens-checked-headless-in-ci` | Each view (Ledger tab, Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px. | [`docs/decisions/screens-checked-headless-in-ci.md`](../docs/decisions/screens-checked-headless-in-ci.md) |
| `seed-load-guards` | Kind: build | [`docs/decisions/seed-load-guards.md`](../docs/decisions/seed-load-guards.md) |
| `spacing-on-4px-grid` | Kind: build | [`docs/decisions/spacing-on-4px-grid.md`](../docs/decisions/spacing-on-4px-grid.md) |
| `sync-revamp-cloudflare` | Kind: build | [`docs/decisions/sync-revamp-cloudflare.md`](../docs/decisions/sync-revamp-cloudflare.md) |
| `the-public-seed` | Kind: build | [`docs/decisions/the-public-seed.md`](../docs/decisions/the-public-seed.md) |
| `three-views-share-one-switch` | The bottom bar replaces the top view switch at every width (`phone-nav-is-bottom-bar`). | [`docs/decisions/three-views-share-one-switch.md`](../docs/decisions/three-views-share-one-switch.md) |
| `typography-cochin-and-mono` | Cochin sets everything that is not a number. | [`docs/decisions/typography-cochin-and-mono.md`](../docs/decisions/typography-cochin-and-mono.md) |
| `undo-removes-only-its-delta` | Undo keeps the deltas of an assignment, not a snapshot of the ledger. | [`docs/decisions/undo-removes-only-its-delta.md`](../docs/decisions/undo-removes-only-its-delta.md) |
| `ux-house-rules-govern` | The owner ruled on 2026-10-11: "apply the latest from claude settings' ux guidelines, along with /design-review /ci-hygiene /fresh-prose". | [`docs/decisions/ux-house-rules-govern.md`](../docs/decisions/ux-house-rules-govern.md) |
| `worker-keeps-snapshots` | **Status:** ruled. | [`docs/decisions/worker-keeps-snapshots.md`](../docs/decisions/worker-keeps-snapshots.md) |

## Unsorted decisions

| Slug | Gist | Link |
|---|---|---|
| `a-host-migration-resets-storage` | **Status:** open. | [`docs/decisions/a-host-migration-resets-storage.md`](../docs/decisions/a-host-migration-resets-storage.md) |
| `a-refund-leaves-every-count` | A package stamped `Refunded` or `Partial refund` drops out of every count and the normal package list. | [`docs/decisions/a-refund-leaves-every-count.md`](../docs/decisions/a-refund-leaves-every-count.md) |
| `a-reveal-ignores-hidedone-too` | A revealed package must ignore `hideDone` as well as the search `query`. | [`docs/decisions/a-reveal-ignores-hidedone-too.md`](../docs/decisions/a-reveal-ignores-hidedone-too.md) |
| `action-row-is-ruled-cells` | **Status:** retired in L11b, commit `12e8721`. | [`docs/decisions/action-row-is-ruled-cells.md`](../docs/decisions/action-row-is-ruled-cells.md) |
| `anchor-is-the-earliest-record` | Each hour and each day keeps its earliest version. | [`docs/decisions/anchor-is-the-earliest-record.md`](../docs/decisions/anchor-is-the-earliest-record.md) |
| `anchors-are-derived-not-stored` | No version carries a stored "hourly" or "daily" kind. | [`docs/decisions/anchors-are-derived-not-stored.md`](../docs/decisions/anchors-are-derived-not-stored.md) |
| `assets-and-icons` | This file holds where the icon assets live, where the master and the generator sit, and the exact export commands. | [`docs/decisions/assets-and-icons.md`](../docs/decisions/assets-and-icons.md) |
| `assign-checks-recorded-cards` | A one-tap assign checks in exactly the cards recorded in an envelope. | [`docs/decisions/assign-checks-recorded-cards.md`](../docs/decisions/assign-checks-recorded-cards.md) |
| `audit-skips-measured-flags` | The native UI tests run Apple's accessibility audit. | [`docs/decisions/audit-skips-measured-flags.md`](../docs/decisions/audit-skips-measured-flags.md) |
| `backup-files-restore-two-ways` | A local backup downloads one JSON file. | [`docs/decisions/backup-files-restore-two-ways.md`](../docs/decisions/backup-files-restore-two-ways.md) |
| `canceled-orders-leave-the-list` | A canceled order leaves the list. | [`docs/decisions/canceled-orders-leave-the-list.md`](../docs/decisions/canceled-orders-leave-the-list.md) |
| `candidates-skip-date-filter` | Each pending envelope lists the outstanding packages that could explain it. | [`docs/decisions/candidates-skip-date-filter.md`](../docs/decisions/candidates-skip-date-filter.md) |
| `card-the-action-row-is-reserved` | The action row's buttons change on the same tap that changes the card. | [`docs/decisions/card-the-action-row-is-reserved.md`](../docs/decisions/card-the-action-row-is-reserved.md) |
| `ci-runs-in-utc` | **Status:** open. | [`docs/decisions/ci-runs-in-utc.md`](../docs/decisions/ci-runs-in-utc.md) |
| `claims-and-tests-change-together` | A behaviour that changes on purpose changes its assertion and its prose in one commit. | [`docs/decisions/claims-and-tests-change-together.md`](../docs/decisions/claims-and-tests-change-together.md) |
| `cost-basis-excludes-ship-and-tax` | **Cost basis** = Σ (Price × Quantity) over the item's non-canceled copies in the active date range. | [`docs/decisions/cost-basis-excludes-ship-and-tax.md`](../docs/decisions/cost-basis-excludes-ship-and-tax.md) |
| `csv-import-shows-a-summary` | A CSV import works by drag and drop, or by the file picker. | [`docs/decisions/csv-import-shows-a-summary.md`](../docs/decisions/csv-import-shows-a-summary.md) |
| `csv-import-stays-web` | **Status:** ruled. | [`docs/decisions/csv-import-stays-web.md`](../docs/decisions/csv-import-stays-web.md) |
| `date-filter-spans-ledger-views` | The date filter applies to the Tally view and the Packages view. | [`docs/decisions/date-filter-spans-ledger-views.md`](../docs/decisions/date-filter-spans-ledger-views.md) |
| `design-form-controls-no-inherit` | Browsers force their own UI font onto `button`, `input`, `select` and `textarea`. | [`docs/decisions/design-form-controls-no-inherit.md`](../docs/decisions/design-form-controls-no-inherit.md) |
| `design-parchment-ledger` | The theme is named "Parchment ledger" (palette D▸, Violet Evergarden–inspired). | [`docs/decisions/design-parchment-ledger.md`](../docs/decisions/design-parchment-ledger.md) |
| `design-view-switch-equal-thirds` | **Retired:** L11a removed the view switch at every width. | [`docs/decisions/design-view-switch-equal-thirds.md`](../docs/decisions/design-view-switch-equal-thirds.md) |
| `disclosure-cells-underline-value` | The two cells that open something underline their value. | [`docs/decisions/disclosure-cells-underline-value.md`](../docs/decisions/disclosure-cells-underline-value.md) |
| `envelope-deletion-unrepresented` | **Status:** closed, by the `deletedAt` tombstone (`sync-revamp-cloudflare`). | [`docs/decisions/envelope-deletion-unrepresented.md`](../docs/decisions/envelope-deletion-unrepresented.md) |
| `envelope-names-match-normname` | Names typed into an envelope match ledger names only after both pass through `normName`. | [`docs/decisions/envelope-names-match-normname.md`](../docs/decisions/envelope-names-match-normname.md) |
| `every-origin-has-own-storage` | The file protocol, the local server, and the live Pages site are three separate origins: `file://`, `http://localhost:4173` and `https://shivinate7.github.io`. | [`docs/decisions/every-origin-has-own-storage.md`](../docs/decisions/every-origin-has-own-storage.md) |
| `every-restore-passes-applybackup` | The file restore and the GitHub pull both pass through one function, `applyBackup()`. | [`docs/decisions/every-restore-passes-applybackup.md`](../docs/decisions/every-restore-passes-applybackup.md) |
| `favicon-is-a-different-drawing` | A browser tab renders the favicon at 16 CSS px. | [`docs/decisions/favicon-is-a-different-drawing.md`](../docs/decisions/favicon-is-a-different-drawing.md) |
| `file-protocol-works-locally` | Opening `index.html` straight off disk works. | [`docs/decisions/file-protocol-works-locally.md`](../docs/decisions/file-protocol-works-locally.md) |
| `fine-grained-token-single-repo` | Each device gets its own named fine-grained personal access token. | [`docs/decisions/fine-grained-token-single-repo.md`](../docs/decisions/fine-grained-token-single-repo.md) |
| `harness-boot-seeds-remote-late` | `boot()` seeds `opts.remote` after the app mounts. | [`docs/decisions/harness-boot-seeds-remote-late.md`](../docs/decisions/harness-boot-seeds-remote-late.md) |
| `harness-drives-resume-by-event` | Tests drive auto-push and the resume by dispatching events. | [`docs/decisions/harness-drives-resume-by-event.md`](../docs/decisions/harness-drives-resume-by-event.md) |
| `harness-drives-the-controls` | The ruled head replaced the native select and the chip disclosures. | [`docs/decisions/harness-drives-the-controls.md`](../docs/decisions/harness-drives-the-controls.md) |
| `harness-drop-feeds-the-csv` | Tests feed a file to the app through its drop handler. | [`docs/decisions/harness-drop-feeds-the-csv.md`](../docs/decisions/harness-drop-feeds-the-csv.md) |
| `harness-jsdom-setup-gotchas` | The harness boots the app inside jsdom. | [`docs/decisions/harness-jsdom-setup-gotchas.md`](../docs/decisions/harness-jsdom-setup-gotchas.md) |
| `harness-push-race-one-shot` | `remote.fail` cannot express a push that conflicts. | [`docs/decisions/harness-push-race-one-shot.md`](../docs/decisions/harness-push-race-one-shot.md) |
| `harness-waits-past-debounces` | Two app timers settle after the next line of a test runs. | [`docs/decisions/harness-waits-past-debounces.md`](../docs/decisions/harness-waits-past-debounces.md) |
| `history-restores-a-saved-version` | The History panel lists saved versions, newest first. | [`docs/decisions/history-restores-a-saved-version.md`](../docs/decisions/history-restores-a-saved-version.md) |
| `hourly-tier-closes-the-gap` | The ring keeps the newest 20 non-milestone versions. | [`docs/decisions/hourly-tier-closes-the-gap.md`](../docs/decisions/hourly-tier-closes-the-gap.md) |
| `icon-paths-and-export-gotchas` | Both icon `href`s must stay relative. | [`docs/decisions/icon-paths-and-export-gotchas.md`](../docs/decisions/icon-paths-and-export-gotchas.md) |
| `invariants-cited-by-slug` | A record or a code comment cites an invariant by its slug, such as `parser-filters`, and never by a number. | [`docs/decisions/invariants-cited-by-slug.md`](../docs/decisions/invariants-cited-by-slug.md) |
| `itp-may-clear-storage` | **Status:** open. | [`docs/decisions/itp-may-clear-storage.md`](../docs/decisions/itp-may-clear-storage.md) |
| `label-photos-downscale-to-2000px` | An envelope photo is a snap of the mailing label. | [`docs/decisions/label-photos-downscale-to-2000px.md`](../docs/decisions/label-photos-downscale-to-2000px.md) |
| `ledger-private-source-public` | **Status:** open. | [`docs/decisions/ledger-private-source-public.md`](../docs/decisions/ledger-private-source-public.md) |
| `listphotos-is-three-valued` | `listPhotos()` answers in one of two shapes: `{known:true, ids}` or `{known:false, reason}`. | [`docs/decisions/listphotos-is-three-valued.md`](../docs/decisions/listphotos-is-three-valued.md) |
| `lost-mail-flags-use-order-date` | An untracked, unreceived package gets an amber "may be lost" flag at 14d from the order date. | [`docs/decisions/lost-mail-flags-use-order-date.md`](../docs/decisions/lost-mail-flags-use-order-date.md) |
| `main-moves-only-by-pr` | Every change reaches `main` through a pull request that passes the required `all-jobs-passed` check. | [`docs/decisions/main-moves-only-by-pr.md`](../docs/decisions/main-moves-only-by-pr.md) |
| `masthead-is-not-project-name` | The app presents itself as **MANIFEST**, under a C.H Postal Company letterhead. | [`docs/decisions/masthead-is-not-project-name.md`](../docs/decisions/masthead-is-not-project-name.md) |
| `masthead-is-one-letterhead` | The top of the page is one composed letterhead, not stacked boxes. | [`docs/decisions/masthead-is-one-letterhead.md`](../docs/decisions/masthead-is-one-letterhead.md) |
| `masthead-running-head-sticky` | The slim running head is `position: sticky` with a fixed 46px height and a 1px rule, 47px drawn. | [`docs/decisions/masthead-running-head-sticky.md`](../docs/decisions/masthead-running-head-sticky.md) |
| `masthead-save-slot-reserved` | The tally footer holds the count line, which reads `N packages · autosaves` on Packages and Ledger, `N unique item(s)` on Tally and `N envelope(s) waiting` on Orphaned (`countLine` in `src/view-rules.mjs`, with ` in range` under a date filter on every view but Orphaned), the exact `N still missing · $X`, and the debounced save indicator. | [`docs/decisions/masthead-save-slot-reserved.md`](../docs/decisions/masthead-save-slot-reserved.md) |
| `masthead-sizing-by-clamp` | Every size in the masthead is set with `clamp()`. | [`docs/decisions/masthead-sizing-by-clamp.md`](../docs/decisions/masthead-sizing-by-clamp.md) |
| `max-cannot-express-an-uncheck` | **Status:** closed, by the `receivedAt` change (`sync-revamp-cloudflare`). | [`docs/decisions/max-cannot-express-an-uncheck.md`](../docs/decisions/max-cannot-express-an-uncheck.md) |
| `merge-is-the-primary-sync-action` | **Status:** retired 2026-10-12. | [`docs/decisions/merge-is-the-primary-sync-action.md`](../docs/decisions/merge-is-the-primary-sync-action.md) |
| `merge-readopts-sync-generation` | `applyBackup` increments `syncGen`. | [`docs/decisions/merge-readopts-sync-generation.md`](../docs/decisions/merge-readopts-sync-generation.md) |
| `milestones-taken-before-risk` | The version store keeps four tiers. | [`docs/decisions/milestones-taken-before-risk.md`](../docs/decisions/milestones-taken-before-risk.md) |
| `motion-a-card-opens-in-order` | Opening a card reveals the bulk row first. | [`docs/decisions/motion-a-card-opens-in-order.md`](../docs/decisions/motion-a-card-opens-in-order.md) |
| `motion-collapse-not-animated` | Closing a card happens at once, with no exit animation. | [`docs/decisions/motion-collapse-not-animated.md`](../docs/decisions/motion-collapse-not-animated.md) |
| `motion-completed-package-gilded` | Finishing a package draws one pass of gold across the card. | [`docs/decisions/motion-completed-package-gilded.md`](../docs/decisions/motion-completed-package-gilded.md) |
| `motion-letterhead-composes-once` | The masthead builds itself once per load, in the order a page is made: wax, rules, name, house, figures. | [`docs/decisions/motion-letterhead-composes-once.md`](../docs/decisions/motion-letterhead-composes-once.md) |
| `motion-masthead-bar-sweeps-once` | The masthead progress bar takes its green a beat after its width lands. | [`docs/decisions/motion-masthead-bar-sweeps-once.md`](../docs/decisions/motion-masthead-bar-sweeps-once.md) |
| `motion-method-side-by-side-proof` | Every moment in the motion design was built two or three ways, as a side-by-side proof sheet. | [`docs/decisions/motion-method-side-by-side-proof.md`](../docs/decisions/motion-method-side-by-side-proof.md) |
| `motion-nothing-may-reflow` | Every keyframe touches only opacity, transform, colour, or box-shadow. | [`docs/decisions/motion-nothing-may-reflow.md`](../docs/decisions/motion-nothing-may-reflow.md) |
| `motion-reduced-leaves-it-drawn` | Turning off animation must never hide anything. | [`docs/decisions/motion-reduced-leaves-it-drawn.md`](../docs/decisions/motion-reduced-leaves-it-drawn.md) |
| `motion-remeasure-not-rereason` | Settle motion claims by measuring, not by reading. | [`docs/decisions/motion-remeasure-not-rereason.md`](../docs/decisions/motion-remeasure-not-rereason.md) |
| `motion-stationery-not-software` | Every motion in the app must feel like paper and ink. | [`docs/decisions/motion-stationery-not-software.md`](../docs/decisions/motion-stationery-not-software.md) |
| `motion-the-check-tick-is-written` | The check tick draws as one stroke, from left to right. | [`docs/decisions/motion-the-check-tick-is-written.md`](../docs/decisions/motion-the-check-tick-is-written.md) |
| `motion-the-stamp-lands` | The stamp rocks down and settles at its resting angle, instead of blinking into place. | [`docs/decisions/motion-the-stamp-lands.md`](../docs/decisions/motion-the-stamp-lands.md) |
| `motion-the-switch-is-one-object` | The ruling: the active-view fill is a single element that slides between thirds. | [`docs/decisions/motion-the-switch-is-one-object.md`](../docs/decisions/motion-the-switch-is-one-object.md) |
| `motion-use-just-became` | Every celebration marks a state that a package can already be in. | [`docs/decisions/motion-use-just-became.md`](../docs/decisions/motion-use-just-became.md) |
| `nothing-recovers-without-the-key` | **Status:** open. | [`docs/decisions/nothing-recovers-without-the-key.md`](../docs/decisions/nothing-recovers-without-the-key.md) |
| `null-remote-info-is-not-no-key` | A null `remoteInfo` means that the status has not loaded yet. | [`docs/decisions/null-remote-info-is-not-no-key.md`](../docs/decisions/null-remote-info-is-not-no-key.md) |
| `offline-is-decided-by-fetch` | The app decides `offline` only by a failed `fetch`, and by nothing else. | [`docs/decisions/offline-is-decided-by-fetch.md`](../docs/decisions/offline-is-decided-by-fetch.md) |
| `one-repo-for-both-halves` | The source repository, `mailaudit`, is public and holds no data. | [`docs/decisions/one-repo-for-both-halves.md`](../docs/decisions/one-repo-for-both-halves.md) |
| `one-stamp-per-package` | Each package holds at most one order stamp. | [`docs/decisions/one-stamp-per-package.md`](../docs/decisions/one-stamp-per-package.md) |
| `orchestrator-may-merge` | The owner granted standing merge authority on 2026-10-10. | [`docs/decisions/orchestrator-may-merge.md`](../docs/decisions/orchestrator-may-merge.md) |
| `orderwand-csv` | This record holds the CSV column list and every quirk found in the user's real OrderWand exports. | [`docs/decisions/orderwand-csv.md`](../docs/decisions/orderwand-csv.md) |
| `orphan-sweep-drops-unused-photos` | One sweep effect covers every path that orphans a photo. | [`docs/decisions/orphan-sweep-drops-unused-photos.md`](../docs/decisions/orphan-sweep-drops-unused-photos.md) |
| `orphaned-colours-by-meaning` | Orphaned uses the app's colour meanings. | [`docs/decisions/orphaned-colours-by-meaning.md`](../docs/decisions/orphaned-colours-by-meaning.md) |
| `outstanding-value-per-level` | The app states what is still outstanding at three levels: the whole ledger, each package and each Tally item. | [`docs/decisions/outstanding-value-per-level.md`](../docs/decisions/outstanding-value-per-level.md) |
| `package-sort-swaps-with-view` | The Packages view has its own sort, separate from the Tally sort. | [`docs/decisions/package-sort-swaps-with-view.md`](../docs/decisions/package-sort-swaps-with-view.md) |
| `packages-group-by-order-seller` | The Packages view groups lines by order and seller. | [`docs/decisions/packages-group-by-order-seller.md`](../docs/decisions/packages-group-by-order-seller.md) |
| `pages-queued-workflow-fix` | GitHub Pages serves the site from the main branch root. | [`docs/decisions/pages-queued-workflow-fix.md`](../docs/decisions/pages-queued-workflow-fix.md) |
| `palette-gold-is-ornament-only` | The `gold` token is ornament only. | [`docs/decisions/palette-gold-is-ornament-only.md`](../docs/decisions/palette-gold-is-ornament-only.md) |
| `palette-inksoft-and-manilaink` | The `inkSoft` token was darkened. | [`docs/decisions/palette-inksoft-and-manilaink.md`](../docs/decisions/palette-inksoft-and-manilaink.md) |
| `palette-silver-stays-cool` | The `silver` token was chosen on looks, not on legibility. | [`docs/decisions/palette-silver-stays-cool.md`](../docs/decisions/palette-silver-stays-cool.md) |
| `palette-theme-color-tracks-paper` | The `theme-color` value in `build.mjs` and the `<style>` page background both track the `paper` token (`#F2E9DA`). | [`docs/decisions/palette-theme-color-tracks-paper.md`](../docs/decisions/palette-theme-color-tracks-paper.md) |
| `palette-tokens-contrast-floor` | The app defines one fixed set of color tokens, each with a named role. | [`docs/decisions/palette-tokens-contrast-floor.md`](../docs/decisions/palette-tokens-contrast-floor.md) |
| `photo-rules-fails-quietly` | The photo-sync rules live in `src/photo-rules.mjs`. | [`docs/decisions/photo-rules-fails-quietly.md`](../docs/decisions/photo-rules-fails-quietly.md) |
| `photo-sweep-two-guards` | The photo sweep deletes blobs that no envelope or draft references. | [`docs/decisions/photo-sweep-two-guards.md`](../docs/decisions/photo-sweep-two-guards.md) |
| `photo-sync-cannot-conflict` | Photo sync is a set difference over ids. | [`docs/decisions/photo-sync-cannot-conflict.md`](../docs/decisions/photo-sync-cannot-conflict.md) |
| `photo-thumbnails-and-viewer` | Photo thumbnails are 56px squares. | [`docs/decisions/photo-thumbnails-and-viewer.md`](../docs/decisions/photo-thumbnails-and-viewer.md) |
| `photos-stay-out-of-the-ledger` | Envelope photos live in IndexedDB. | [`docs/decisions/photos-stay-out-of-the-ledger.md`](../docs/decisions/photos-stay-out-of-the-ledger.md) |
| `progress-bar-accent-then-green` | The progress bar fills with accent violet while it is in progress. | [`docs/decisions/progress-bar-accent-then-green.md`](../docs/decisions/progress-bar-accent-then-green.md) |
| `pull-needs-a-key-too` | Push needs a fine-grained personal access token. | [`docs/decisions/pull-needs-a-key-too.md`](../docs/decisions/pull-needs-a-key-too.md) |
| `readme-is-minimal` | The public repo has a short README. | [`docs/decisions/readme-is-minimal.md`](../docs/decisions/readme-is-minimal.md) |
| `records-name-what-dates-them` | Every decision record carries one line that starts with "**Holds while:**". | [`docs/decisions/records-name-what-dates-them.md`](../docs/decisions/records-name-what-dates-them.md) |
| `remote-rules-fail-quietly` | Two adapter decisions get their own pure functions, in `src/remote-rules.mjs`. | [`docs/decisions/remote-rules-fail-quietly.md`](../docs/decisions/remote-rules-fail-quietly.md) |
| `remote-sync-is-off-the-save-path` | The local save runs on its own debounced path, with a 500ms debounce and a saved or saving indicator. | [`docs/decisions/remote-sync-is-off-the-save-path.md`](../docs/decisions/remote-sync-is-off-the-save-path.md) |
| `retention-tiers-are-unioned` | A saved version survives a prune when any one of four rules keeps it. | [`docs/decisions/retention-tiers-are-unioned.md`](../docs/decisions/retention-tiers-are-unioned.md) |
| `ruled-head-masthead-vocabulary` | The control region uses the masthead's own vocabulary. | [`docs/decisions/ruled-head-masthead-vocabulary.md`](../docs/decisions/ruled-head-masthead-vocabulary.md) |
| `ruled-head-range-picked` | The custom range uses a month picker. | [`docs/decisions/ruled-head-range-picked.md`](../docs/decisions/ruled-head-range-picked.md) |
| `ruled-head-resume-is-reopening` | An iOS home-screen app is usually backgrounded, not closed. | [`docs/decisions/ruled-head-resume-is-reopening.md`](../docs/decisions/ruled-head-resume-is-reopening.md) |
| `ruled-head-showing-unreceived` | The Showing row replaces the old "Hide received" button. | [`docs/decisions/ruled-head-showing-unreceived.md`](../docs/decisions/ruled-head-showing-unreceived.md) |
| `ruled-head-stale-clock-agreement` | The staleness clock is the last time this device agreed with the Worker. | [`docs/decisions/ruled-head-stale-clock-agreement.md`](../docs/decisions/ruled-head-stale-clock-agreement.md) |
| `search-filters-inside-package` | A search filters inside a package. | [`docs/decisions/search-filters-inside-package.md`](../docs/decisions/search-filters-inside-package.md) |
| `search-hide-keep-tally-counts` | Search and hide-received filter the copy breakdown under a Tally item. | [`docs/decisions/search-hide-keep-tally-counts.md`](../docs/decisions/search-hide-keep-tally-counts.md) |
| `session-tiers-adopted` | The owner granted the session tiers for this repo on 2026-10-28 at 02:31 CDT (item 2 a of the claude-settings coordinator). | [`docs/decisions/session-tiers-adopted.md`](../docs/decisions/session-tiers-adopted.md) |
| `sha-accepted-only-after-apply` | The app stores the remote sha only after it applies the pulled bytes. | [`docs/decisions/sha-accepted-only-after-apply.md`](../docs/decisions/sha-accepted-only-after-apply.md) |
| `shared-origin-needs-namespace` | `shivinate7.github.io` is a single origin across every repo the user has on Pages. | [`docs/decisions/shared-origin-needs-namespace.md`](../docs/decisions/shared-origin-needs-namespace.md) |
| `shared-tokens-and-fixtures` | **Status:** ruled. | [`docs/decisions/shared-tokens-and-fixtures.md`](../docs/decisions/shared-tokens-and-fixtures.md) |
| `shrunk-envelope-gets-fresh-stamp` | A partial assignment leaves some entries behind, so the envelope shrinks. | [`docs/decisions/shrunk-envelope-gets-fresh-stamp.md`](../docs/decisions/shrunk-envelope-gets-fresh-stamp.md) |
| `single-file-architecture` | The whole application lives in one React component file, `src/app.jsx`. | [`docs/decisions/single-file-architecture.md`](../docs/decisions/single-file-architecture.md) |
| `stamp-band-opens-the-editor` | A stamp shows as a band under the package header. | [`docs/decisions/stamp-band-opens-the-editor.md`](../docs/decisions/stamp-band-opens-the-editor.md) |
| `stamp-removal-writes-a-tombstone` | Removing an order stamp writes a tombstone value instead of deleting the entry. | [`docs/decisions/stamp-removal-writes-a-tombstone.md`](../docs/decisions/stamp-removal-writes-a-tombstone.md) |
| `stamped-filter-on-the-pipeline` | The `N stamped` cell filters the Packages view to stamped packages. | [`docs/decisions/stamped-filter-on-the-pipeline.md`](../docs/decisions/stamped-filter-on-the-pipeline.md) |
| `stamped-package-hides-lost-flag` | Any stamped package hides the lost-mail warning. | [`docs/decisions/stamped-package-hides-lost-flag.md`](../docs/decisions/stamped-package-hides-lost-flag.md) |
| `storage-split-three-adapters` | The application component (`app.jsx`) never calls localStorage or IndexedDB itself. | [`docs/decisions/storage-split-three-adapters.md`](../docs/decisions/storage-split-three-adapters.md) |
| `sync-line-toggles-its-panel` | The sync line renders when sync is broken or the panel is open. | [`docs/decisions/sync-line-toggles-its-panel.md`](../docs/decisions/sync-line-toggles-its-panel.md) |
| `sync-panel-is-two-column-grid` | The sync panel has no option grid. | [`docs/decisions/sync-panel-is-two-column-grid.md`](../docs/decisions/sync-panel-is-two-column-grid.md) |
| `sync-particulars-ruled-values` | The particulars under the sync grid are the head cells' two parts, laid on their side. | [`docs/decisions/sync-particulars-ruled-values.md`](../docs/decisions/sync-particulars-ruled-values.md) |
| `tally-pools-on-the-exact-name` | The Tally view pools line items by *exact* Product Name, across every seller and order. | [`docs/decisions/tally-pools-on-the-exact-name.md`](../docs/decisions/tally-pools-on-the-exact-name.md) |
| `tally-row-lists-its-copies` | A collapsed Tally row shows `got/ordered`, the unit rate, the outstanding figure, the seller and order counts, and the sets involved. | [`docs/decisions/tally-row-lists-its-copies.md`](../docs/decisions/tally-row-lists-its-copies.md) |
| `tally-sort-keys-are-six` | The Tally view sorts its rows on six keys. | [`docs/decisions/tally-sort-keys-are-six.md`](../docs/decisions/tally-sort-keys-are-six.md) |
| `testing-check-something-rereads` | Changing a value an adapter owns tests nothing unless a component reads it again. | [`docs/decisions/testing-check-something-rereads.md`](../docs/decisions/testing-check-something-rereads.md) |
| `testing-chokepoint-two-branches` | A shared chokepoint can have two read paths. | [`docs/decisions/testing-chokepoint-two-branches.md`](../docs/decisions/testing-chokepoint-two-branches.md) |
| `testing-deps-caught-by-edit` | A memo that omits a dependency stays hidden while the memo re-runs for other reasons. | [`docs/decisions/testing-deps-caught-by-edit.md`](../docs/decisions/testing-deps-caught-by-edit.md) |
| `testing-green-suite-hides-break` | A fully passing suite proved nothing about the single most important scenario. | [`docs/decisions/testing-green-suite-hides-break.md`](../docs/decisions/testing-green-suite-hides-break.md) |
| `testing-isolate-each-tier` | When several rules can each keep or drop the same record, a test on one rule must neutralize every other rule first. | [`docs/decisions/testing-isolate-each-tier.md`](../docs/decisions/testing-isolate-each-tier.md) |
| `testing-jsdom-has-no-layout` | A jsdom suite cannot see width, shift, or truncation. | [`docs/decisions/testing-jsdom-has-no-layout.md`](../docs/decisions/testing-jsdom-has-no-layout.md) |
| `testing-mock-field-stops-decor` | A mock field that nothing reads can stay wrong for a long time, without harm. | [`docs/decisions/testing-mock-field-stops-decor.md`](../docs/decisions/testing-mock-field-stops-decor.md) |
| `testing-mock-is-test-below-seam` | Below the seam an app-level test cannot reach, the mock stands in for the real defect. | [`docs/decisions/testing-mock-is-test-below-seam.md`](../docs/decisions/testing-mock-is-test-below-seam.md) |
| `testing-mutant-dies-check-cause` | A mutant dying does not prove the intended assertion caught it. | [`docs/decisions/testing-mutant-dies-check-cause.md`](../docs/decisions/testing-mutant-dies-check-cause.md) |
| `testing-partial-qty-needs-case` | Every assignment in groups 1 to 19 takes a card's full quantity. | [`docs/decisions/testing-partial-qty-needs-case.md`](../docs/decisions/testing-partial-qty-needs-case.md) |
| `testing-pull-payload-eq-void` | A pull makes the local ledger identical to the remote one. | [`docs/decisions/testing-pull-payload-eq-void.md`](../docs/decisions/testing-pull-payload-eq-void.md) |
| `testing-surviving-mutant` | A surviving mutant shows that the fixtures never reach the state where the bug matters. | [`docs/decisions/testing-surviving-mutant.md`](../docs/decisions/testing-surviving-mutant.md) |
| `testing-throwing-assert-bad-kill` | A test that throws on a mutant is worse than one that fails cleanly. | [`docs/decisions/testing-throwing-assert-bad-kill.md`](../docs/decisions/testing-throwing-assert-bad-kill.md) |
| `the-token-used-to-span-two-repos` | **Status:** closed, by the `mailaudit-data` move. | [`docs/decisions/the-token-used-to-span-two-repos.md`](../docs/decisions/the-token-used-to-span-two-repos.md) |
| `the-write-budget-is-shared` | **Status:** open. | [`docs/decisions/the-write-budget-is-shared.md`](../docs/decisions/the-write-budget-is-shared.md) |
| `token-expires-without-warning` | **Status:** open. | [`docs/decisions/token-expires-without-warning.md`](../docs/decisions/token-expires-without-warning.md) |
| `token-field-is-sixteen-pixels` | The sync key field is set at 16px. | [`docs/decisions/token-field-is-sixteen-pixels.md`](../docs/decisions/token-field-is-sixteen-pixels.md) |
| `token-lives-outside-namespace` | The GitHub access token lives at the raw localStorage key `mailday-remote:v1`. | [`docs/decisions/token-lives-outside-namespace.md`](../docs/decisions/token-lives-outside-namespace.md) |
| `token-sits-on-shared-origin` | **Status:** open. | [`docs/decisions/token-sits-on-shared-origin.md`](../docs/decisions/token-sits-on-shared-origin.md) |
| `unit-rate-is-not-the-position` | The collapsed Tally row shows the **unit rate**, not the basis. | [`docs/decisions/unit-rate-is-not-the-position.md`](../docs/decisions/unit-rate-is-not-the-position.md) |
| `unwritable-store-says-so` | When IndexedDB cannot be written, every version save must fail visibly. | [`docs/decisions/unwritable-store-says-so.md`](../docs/decisions/unwritable-store-says-so.md) |
| `upload-zone-opens-when-empty` | The upload zone opens when the user asks for it. | [`docs/decisions/upload-zone-opens-when-empty.md`](../docs/decisions/upload-zone-opens-when-empty.md) |
| `vendor-toggle-undecided` | **Status:** open. | [`docs/decisions/vendor-toggle-undecided.md`](../docs/decisions/vendor-toggle-undecided.md) |
| `versions-get-their-own-database` | `window.versions` is a separate IndexedDB database. | [`docs/decisions/versions-get-their-own-database.md`](../docs/decisions/versions-get-their-own-database.md) |

## Debts

| Slug | Gist | Link |
|---|---|---|
| `app-build-waits-xcode-27` | No CI job compiles the native app. | [`docs/debts/app-build-waits-xcode-27.md`](../docs/debts/app-build-waits-xcode-27.md) |
| `armed-reset-mistap-unmeasured` | A mis-tap on a control next to the armed Reset box is unmeasured, and so is the width of the armed row. | [`docs/debts/armed-reset-mistap-unmeasured.md`](../docs/debts/armed-reset-mistap-unmeasured.md) |
| `backup-unwatched` | Once the watchdog is off, no check reads the Worker's snapshots or the `data` branch, so a stopped backup raises no alarm. | [`docs/debts/backup-unwatched.md`](../docs/debts/backup-unwatched.md) |
| `card-action-row-unmeasured` | The action row's content need at its tallest state is not measured at `f97e423`. | [`docs/debts/card-action-row-unmeasured.md`](../docs/debts/card-action-row-unmeasured.md) |
| `card-eleven-px-step-unmeasured` | At `1607933` the three-button state was not reproduced, so the 11px row step at 320px is unmeasured at the grid head. | [`docs/debts/card-eleven-px-step-unmeasured.md`](../docs/debts/card-eleven-px-step-unmeasured.md) |
| `checkin-error-bar-is-sans` | The native Packages and Tally check-in error bars (`checkin-error`) use the system footnote font on `.regularMaterial`, centred. | [`docs/debts/checkin-error-bar-is-sans.md`](../docs/debts/checkin-error-bar-is-sans.md) |
| `chip-gap-tolerance-at-12px` | The 12px chip gap is not re-measured. | [`docs/debts/chip-gap-tolerance-at-12px.md`](../docs/debts/chip-gap-tolerance-at-12px.md) |
| `claim-11-fixed-edge-taps` | Claim 11 of `check:screens` does not test a tap just past a fixed control's edge, where the tap lands on scrolling content, or the reverse. | [`docs/debts/claim-11-fixed-edge-taps.md`](../docs/debts/claim-11-fixed-edge-taps.md) |
| `claim-9-fractional-box-edges` | A 43.5px box reads as 44px, so claim 9 can pass a box just under 44px. | [`docs/debts/claim-9-fractional-box-edges.md`](../docs/debts/claim-9-fractional-box-edges.md) |
| `cloudflare-access-login-untested` | Whether the backup sign-in survives in an iOS home-screen app has not been run on a device. | [`docs/debts/cloudflare-access-login-untested.md`](../docs/debts/cloudflare-access-login-untested.md) |
| `discard-keeps-draft` | `discardEnvelope` in `src/app.jsx` never clears the draft. | [`docs/debts/discard-keeps-draft.md`](../docs/debts/discard-keeps-draft.md) |
| `duo-bar-dynamic-type-clips` | The open Duo's tab bar is a fixed 64 pt pill, while its labels scale with Dynamic Type. | [`docs/debts/duo-bar-dynamic-type-clips.md`](../docs/debts/duo-bar-dynamic-type-clips.md) |
| `duo-checkin-error-under-bar` | On the open Duo, the Packages `checkin-error` overlay sits at the tab's bottom edge. | [`docs/debts/duo-checkin-error-under-bar.md`](../docs/debts/duo-checkin-error-under-bar.md) |
| `duo-fold-change-unpinned` | The shell UI tests launch MANIFEST in one pose and check the tab bar. | [`docs/debts/duo-fold-change-unpinned.md`](../docs/debts/duo-fold-change-unpinned.md) |
| `duo-hand-mockup-gaps` | Poses 1, 2, 3 and 5 of PR 144, the Duo round 2 design pull request, show eight parts that the build lacks: | [`docs/debts/duo-hand-mockup-gaps.md`](../docs/debts/duo-hand-mockup-gaps.md) |
| `duo-keyboard-gap-unmeasured` | On the open Duo, every tab reserves the custom tab bar's height as a bottom scroll margin. | [`docs/debts/duo-keyboard-gap-unmeasured.md`](../docs/debts/duo-keyboard-gap-unmeasured.md) |
| `duo-left-page-dead-margin` | On the open Duo, DuoSystemBar reserves the custom bar's height as a bottom scroll margin in every tab. | [`docs/debts/duo-left-page-dead-margin.md`](../docs/debts/duo-left-page-dead-margin.md) |
| `duo-stacked-poses-unbuilt` | Ruled item 28 of `duo-card-in-hand` sets the stacked poses, laptop and held tall. | [`docs/debts/duo-stacked-poses-unbuilt.md`](../docs/debts/duo-stacked-poses-unbuilt.md) |
| `duo-tab-items-twice` | RootView names each tab's title, symbol and badge twice: once for the system tab bar and once for the Duo's custom bar. | [`docs/debts/duo-tab-items-twice.md`](../docs/debts/duo-tab-items-twice.md) |
| `failed-photo-download-no-retry` | When a merge's photo download fails, the id stays in the ledger and the tile stays blank. | [`docs/debts/failed-photo-download-no-retry.md`](../docs/debts/failed-photo-download-no-retry.md) |
| `half-open-socket-has-no-ping` | A socket that stays open and hears nothing gets no ping. | [`docs/debts/half-open-socket-has-no-ping.md`](../docs/debts/half-open-socket-has-no-ping.md) |
| `hand-notice-cuts-match-row` | On Card in Hand with the keys up, a manila box (Suspense, or Released, not checked in) sits above New envelope and the match list. | [`docs/debts/hand-notice-cuts-match-row.md`](../docs/debts/hand-notice-cuts-match-row.md) |
| `hand-post-scroll-hides-sender` | On the open Duo, when a held card's Post offer shows, the answer page scrolls it above the keys. | [`docs/debts/hand-post-scroll-hides-sender.md`](../docs/debts/hand-post-scroll-hides-sender.md) |
| `hand-stale-checkin-error` | On Card in Hand, a failed line check-in shows `hand-checkin-error` on the envelope page. | [`docs/debts/hand-stale-checkin-error.md`](../docs/debts/hand-stale-checkin-error.md) |
| `hand-stray-keeps-tie` | On Card in Hand, after New envelope releases a held card, the left page says "It no longer decides an envelope". | [`docs/debts/hand-stray-keeps-tie.md`](../docs/debts/hand-stray-keeps-tie.md) |
| `hand-suspense-tap-shift` | On Card in Hand, tapping a match whose name two open envelopes share opens the Suspense box above New envelope and the match list. | [`docs/debts/hand-suspense-tap-shift.md`](../docs/debts/hand-suspense-tap-shift.md) |
| `header-gestures-unmeasured` | No device ran a phone long-press on the package header. | [`docs/debts/header-gestures-unmeasured.md`](../docs/debts/header-gestures-unmeasured.md) |
| `hidden-tab-apply-delay-unmeasured` | Nobody has timed a reply on a hidden or frozen tab. | [`docs/debts/hidden-tab-apply-delay-unmeasured.md`](../docs/debts/hidden-tab-apply-delay-unmeasured.md) |
| `ios-touch-adjust-unmeasured` | Claim 17a of `check:screens` sweeps real touches in Chromium. | [`docs/debts/ios-touch-adjust-unmeasured.md`](../docs/debts/ios-touch-adjust-unmeasured.md) |
| `key-re-accepts-token-shape` | A GitHub token uses only letters, digits and underscores, so the key check accepts a token as a key. | [`docs/debts/key-re-accepts-token-shape.md`](../docs/debts/key-re-accepts-token-shape.md) |
| `lost-photo-clock-is-envelope-age` | The 7-day lost-photo clock runs from the envelope's `createdAt`. | [`docs/debts/lost-photo-clock-is-envelope-age.md`](../docs/debts/lost-photo-clock-is-envelope-age.md) |
| `lost-tile-waits-for-first-post` | The lost tile shows only after the push survey that follows a successful POST. | [`docs/debts/lost-tile-waits-for-first-post.md`](../docs/debts/lost-tile-waits-for-first-post.md) |
| `n11-device-check-not-run` | Lane N11 is the owner's check on a device, as ruled in `native-build-lanes`, and it has not run. | [`docs/debts/n11-device-check-not-run.md`](../docs/debts/n11-device-check-not-run.md) |
| `native-armed-audit-misses-ask` | `PackageStampUITests.testAccessibilityAuditStampRemoveArmed` audits the editor with Remove armed. | [`docs/debts/native-armed-audit-misses-ask.md`](../docs/debts/native-armed-audit-misses-ask.md) |
| `native-ask-has-no-cancel-focus` | `armed-reset-takes-the-row` has Cancel take first focus when an ask arms. | [`docs/debts/native-ask-has-no-cancel-focus.md`](../docs/debts/native-ask-has-no-cancel-focus.md) |
| `native-axl-rows-break` | At the largest accessibility text size, three native rows keep one line and break or clip: | [`docs/debts/native-axl-rows-break.md`](../docs/debts/native-axl-rows-break.md) |
| `native-backup-has-no-photos` | `LedgerStore.backup()` exports the ledger document only, and `LedgerTab` offers one Backup row. | [`docs/debts/native-backup-has-no-photos.md`](../docs/debts/native-backup-has-no-photos.md) |
| `native-backup-ui-unpinned` | `MastheadBackupUITests` checks that the Backup row is a 44pt button and runs an accessibility audit on the Ledger tab. | [`docs/debts/native-backup-ui-unpinned.md`](../docs/debts/native-backup-ui-unpinned.md) |
| `native-backup-web-restore-unrun` | The web app is the only restore path for a backup file (`native-parity-table`). | [`docs/debts/native-backup-web-restore-unrun.md`](../docs/debts/native-backup-web-restore-unrun.md) |
| `native-candidate-lines-wrap` | On a candidate row in `native/Manifest/OrphanedView.swift`, the line with the date, the untracked tag and the order id wraps at large Dynamic Type. | [`docs/debts/native-candidate-lines-wrap.md`](../docs/debts/native-candidate-lines-wrap.md) |
| `native-card-gestures-unpinned` | The owner ruled on 2026-10-21 that the card header text selects, seller included, and that the header's taps still work. | [`docs/debts/native-card-gestures-unpinned.md`](../docs/debts/native-card-gestures-unpinned.md) |
| `native-card-lost-flags-unbuilt` | The web card's date line carries a lost-mail warning (`lostMail`: "may be lost" from 14 days, "refund window closing" from 30) and a tracked or untracked glyph after the date (`lost-mail-flags-use-order-date`, `stamped-package-hides-lost-flag`). | [`docs/debts/native-card-lost-flags-unbuilt.md`](../docs/debts/native-card-lost-flags-unbuilt.md) |
| `native-card-state-in-swift` | `LineState` in `PackageCard.swift` and `packageState` in `PackagesView.swift` work out whether a line, and a whole package, is done, partial or open in Swift. | [`docs/debts/native-card-state-in-swift.md`](../docs/debts/native-card-state-in-swift.md) |
| `native-cold-launch-ledger-shift` | At launch the app sets the masthead only after boot (`native/Manifest/ManifestApp.swift`). | [`docs/debts/native-cold-launch-ledger-shift.md`](../docs/debts/native-cold-launch-ledger-shift.md) |
| `native-compose-is-one-fade` | `MastheadView` animates the seal, the rules, the title and the tallies together, in one ease-out of 1.06 seconds. | [`docs/debts/native-compose-is-one-fade.md`](../docs/debts/native-compose-is-one-fade.md) |
| `native-composer-fields-two-lines` | The card name and note fields in the native envelope composer (`OrphanedView.swift`) are vertical-axis fields with `lineLimit(2...3)`. | [`docs/debts/native-composer-fields-two-lines.md`](../docs/debts/native-composer-fields-two-lines.md) |
| `native-count-line-clips` | The native count line is one line with no `minimumScaleFactor`, so at 4-digit counts, or at xxxLarge text at 320pt, it clips with no ellipsis. | [`docs/debts/native-count-line-clips.md`](../docs/debts/native-count-line-clips.md) |
| `native-dialog-ban-unpinned` | Nothing pins the ban on `window.confirm` and `alert` itself. | [`docs/debts/native-dialog-ban-unpinned.md`](../docs/debts/native-dialog-ban-unpinned.md) |
| `native-discard-arm-unpinned` | No test pins the native Discard ask. | [`docs/debts/native-discard-arm-unpinned.md`](../docs/debts/native-discard-arm-unpinned.md) |
| `native-discard-panel-covers-head` | On Orphaned, an armed Discard opens a panel that covers the envelope header at every text size: the date label, Edit and Discard. | [`docs/debts/native-discard-panel-covers-head.md`](../docs/debts/native-discard-panel-covers-head.md) |
| `native-envelope-has-no-photos` | The native Orphaned view shows no photo and has no capture control. | [`docs/debts/native-envelope-has-no-photos.md`](../docs/debts/native-envelope-has-no-photos.md) |
| `native-filters-tally-only` | Lane N6 built search, hide-received and the six sort keys on the Tally view only. | [`docs/debts/native-filters-tally-only.md`](../docs/debts/native-filters-tally-only.md) |
| `native-job-hosted-time-unmeasured` | The 8 to 15 minute estimate for the full native job is unmeasured. | [`docs/debts/native-job-hosted-time-unmeasured.md`](../docs/debts/native-job-hosted-time-unmeasured.md) |
| `native-kept-copy-has-no-route` | No native view opens the kept copy, and no lane records a route to it. | [`docs/debts/native-kept-copy-has-no-route.md`](../docs/debts/native-kept-copy-has-no-route.md) |
| `native-key-scan-skips-views` | No lane scans SwiftUI view state, such as `@State` in a view. | [`docs/debts/native-key-scan-skips-views.md`](../docs/debts/native-key-scan-skips-views.md) |
| `native-ledger-pins-missing` | No test pins the millisecond kept-name format, the missing-file case, or the unwrapped-error sentence in Load and save. | [`docs/debts/native-ledger-pins-missing.md`](../docs/debts/native-ledger-pins-missing.md) |
| `native-ledger-tab-unbuilt` | The native Ledger tab holds the Sync row and panel, the History row, the Backup row and the Reset box, in `native/Manifest/LedgerTab.swift`. | [`docs/debts/native-ledger-tab-unbuilt.md`](../docs/debts/native-ledger-tab-unbuilt.md) |
| `native-masthead-axl-clips` | At accessibility text sizes two masthead lines break. | [`docs/debts/native-masthead-axl-clips.md`](../docs/debts/native-masthead-axl-clips.md) |
| `native-masthead-foot-row-gap` | On every tab, the masthead foot's second row sits about 4.6pt lower than the web's. | [`docs/debts/native-masthead-foot-row-gap.md`](../docs/debts/native-masthead-foot-row-gap.md) |
| `native-masthead-stale-after-tabs` | `MastheadModel.refresh()` now runs at boot, after a check-in on Packages or Tally, after each Orphaned write and after a Ledger reset or restore. | [`docs/debts/native-masthead-stale-after-tabs.md`](../docs/debts/native-masthead-stale-after-tabs.md) |
| `native-merge-notice-unbuilt` | `SyncClient` keeps the `stats` of the last adopted reply (`native-reply-waits-generation`). | [`docs/debts/native-merge-notice-unbuilt.md`](../docs/debts/native-merge-notice-unbuilt.md) |
| `native-merge-skips-photo-fetch` | `PhotoSync.pull` downloads the blobs that a ledger names, and it has no caller. | [`docs/debts/native-merge-skips-photo-fetch.md`](../docs/debts/native-merge-skips-photo-fetch.md) |
| `native-milestone-needed-unpinned` | A native Reset, a restore and a removing sync reply each save a milestone first. | [`docs/debts/native-milestone-needed-unpinned.md`](../docs/debts/native-milestone-needed-unpinned.md) |
| `native-orphaned-colours-unbuilt` | The native Orphaned view paints from `shared/tokens.json` through `OrphanedPaint`, and a unit test pins the meanings (`orphaned-colours-by-meaning`). | [`docs/debts/native-orphaned-colours-unbuilt.md`](../docs/debts/native-orphaned-colours-unbuilt.md) |
| `native-photo-ids-kept-uncalled` | `PhotoIds.kept` holds the rule of `photo-ids-restore-keep-if-known`. | [`docs/debts/native-photo-ids-kept-uncalled.md`](../docs/debts/native-photo-ids-kept-uncalled.md) |
| `native-photo-screens-unwired` | Lane N10 built `PhotoStrip`, `PhotoViewer` and `PhotoSyncBar` in `native/Manifest/PhotoViews.swift`. | [`docs/debts/native-photo-screens-unwired.md`](../docs/debts/native-photo-screens-unwired.md) |
| `native-photo-sweep-unbuilt` | Nothing on native removes a blob that no envelope or draft uses. | [`docs/debts/native-photo-sweep-unbuilt.md`](../docs/debts/native-photo-sweep-unbuilt.md) |
| `native-photo-viewer-unpinned` | `PhotoViewerModelTests` pins the modal state and the focus that Escape and a tap return. | [`docs/debts/native-photo-viewer-unpinned.md`](../docs/debts/native-photo-viewer-unpinned.md) |
| `native-pinned-card-dynamic-type` | `MastheadBackupUITests.testAccessibilityAuditWithTheRunningHeadPinned` scrolls Packages until the running head pins, then audits. | [`docs/debts/native-pinned-card-dynamic-type.md`](../docs/debts/native-pinned-card-dynamic-type.md) |
| `native-pull-generation-unpinned` | `SyncClient` drops a GET reply when the store's generation changed, or when the user data differs from what the last reply carried. | [`docs/debts/native-pull-generation-unpinned.md`](../docs/debts/native-pull-generation-unpinned.md) |
| `native-removal-rule-is-swift` | `LedgerStore.removes` in `native/ManifestKit/Sources/ManifestKit/Versions.swift` decides whether an incoming ledger removes something, and so whether `adopt` saves `before sync`. | [`docs/debts/native-removal-rule-is-swift.md`](../docs/debts/native-removal-rule-is-swift.md) |
| `native-restore-keeps-old-times` | The web restore gives the restore time to every check-in key, stamp and envelope (`restampRestore` in `src/merge-rules.mjs`). | [`docs/debts/native-restore-keeps-old-times.md`](../docs/debts/native-restore-keeps-old-times.md) |
| `native-restore-pill-tap-unpinned` | `VersionsUITests` checks the armed Restore by tapping the version row's middle twice. | [`docs/debts/native-restore-pill-tap-unpinned.md`](../docs/debts/native-restore-pill-tap-unpinned.md) |
| `native-runner-image-unverified` | Whether the `macos-26` runner image has Xcode 27 and xcodegen is unknown. | [`docs/debts/native-runner-image-unverified.md`](../docs/debts/native-runner-image-unverified.md) |
| `native-runner-keychain-unverified` | Whether the runner keychain is unlocked is unknown. | [`docs/debts/native-runner-keychain-unverified.md`](../docs/debts/native-runner-keychain-unverified.md) |
| `native-seller-scale-unmeasured` | The native card seller (`PackagesView.swift`, `PackageRow.header`) carries `.minimumScaleFactor(0.5)` on 15pt Cochin. | [`docs/debts/native-seller-scale-unmeasured.md`](../docs/debts/native-seller-scale-unmeasured.md) |
| `native-stamp-load-unmeasured` | Step 6 adds stamp work to `PackagesModel.load()` (`native/ManifestKit/Sources/ManifestKit/Packages.swift`): eight or more hops into JavaScriptCore, three of them one call per stored stamp. | [`docs/debts/native-stamp-load-unmeasured.md`](../docs/debts/native-stamp-load-unmeasured.md) |
| `native-sync-glue-unpinned` | The tests run `SyncClient` and `PressGate` on fakes. | [`docs/debts/native-sync-glue-unpinned.md`](../docs/debts/native-sync-glue-unpinned.md) |
| `native-sync-live-unrun` | The tests of lanes N4a and N4b run `SyncClient` on a stub URL protocol, a fake socket, a fake Keychain and a sleep gate. | [`docs/debts/native-sync-live-unrun.md`](../docs/debts/native-sync-live-unrun.md) |
| `native-sync-tally-rules-in-swift` | Six pieces of view logic live in Swift, and `rules-run-in-javascriptcore` says Swift holds no copy of a view rule. | [`docs/debts/native-sync-tally-rules-in-swift.md`](../docs/debts/native-sync-tally-rules-in-swift.md) |
| `native-tally-copy-no-flags` | A native Tally copy is drawn by the item line Packages draws, so a copy of two or more has the got/qty stepper. | [`docs/debts/native-tally-copy-no-flags.md`](../docs/debts/native-tally-copy-no-flags.md) |
| `native-tally-ellipsis-unpinned` | The native Tally meta line draws its own "…" in `native/Manifest/TallyView.swift` (`metaLine`). | [`docs/debts/native-tally-ellipsis-unpinned.md`](../docs/debts/native-tally-ellipsis-unpinned.md) |
| `native-ui-tests-not-in-ci` | The native job runs the ST tests only, so native UI tests and builds are not in CI. | [`docs/debts/native-ui-tests-not-in-ci.md`](../docs/debts/native-ui-tests-not-in-ci.md) |
| `native-undo-notice-padding` | The Undo notice in `native/Manifest/OrphanedView.swift` pads its rows 4pt above and below. | [`docs/debts/native-undo-notice-padding.md`](../docs/debts/native-undo-notice-padding.md) |
| `native-version-names-unpinned` | A version is <id>.bin and <id>.json. | [`docs/debts/native-version-names-unpinned.md`](../docs/debts/native-version-names-unpinned.md) |
| `order-id-visible-unbuilt` | The package header gives the order id its own line (built 2026-10-20). | [`docs/debts/order-id-visible-unbuilt.md`](../docs/debts/order-id-visible-unbuilt.md) |
| `orders-job-unbuilt` | The owner ruled on 2026-10-27 at 20:19 CDT that the job runs as a cron on the existing Worker. | [`docs/debts/orders-job-unbuilt.md`](../docs/debts/orders-job-unbuilt.md) |
| `orphaned-reach-unpinned` | No test pins that Re-import, Backup and Reset must stay reachable from Orphaned, and it is unverified. | [`docs/debts/orphaned-reach-unpinned.md`](../docs/debts/orphaned-reach-unpinned.md) |
| `panel-paper-fill-unbuilt` | Overlay panels carry no `paper` fill: `panelWrap` in `src/app.jsx` sets padding and a top border, and no background. | [`docs/debts/panel-paper-fill-unbuilt.md`](../docs/debts/panel-paper-fill-unbuilt.md) |
| `panels-overlay-unbuilt` | Today a panel takes layout space and pushes the list down. | [`docs/debts/panels-overlay-unbuilt.md`](../docs/debts/panels-overlay-unbuilt.md) |
| `photo-put-unrun-on-github` | `pushPhoto` and `pullPhoto` on `window.remote` (`src/entry.jsx`) have never run against real GitHub. | [`docs/debts/photo-put-unrun-on-github.md`](../docs/debts/photo-put-unrun-on-github.md) |
| `photoget-throw-counts-as-kill` | In `test/photoget.test.mjs`, `runCase` turns a throw into a red case, and a red case counts as a mutant kill. | [`docs/debts/photoget-throw-counts-as-kill.md`](../docs/debts/photoget-throw-counts-as-kill.md) |
| `received-at-size-unmeasured` | `receivedAt` is never pruned, and its size has not been measured. | [`docs/debts/received-at-size-unmeasured.md`](../docs/debts/received-at-size-unmeasured.md) |
| `recent-log-unbuilt` | The log, its merge rule, its panel and its undo are ruled and not built, in either client. | [`docs/debts/recent-log-unbuilt.md`](../docs/debts/recent-log-unbuilt.md) |
| `recent-log-unmeasured` | Four figures are unmeasured. | [`docs/debts/recent-log-unmeasured.md`](../docs/debts/recent-log-unmeasured.md) |
| `reimport-received-unpinned` | Nothing pins that `received` survives a re-import. | [`docs/debts/reimport-received-unpinned.md`](../docs/debts/reimport-received-unpinned.md) |
| `reset-all-keeps-token-unpinned` | No test pins that `resetAll` keeps the GitHub token. | [`docs/debts/reset-all-keeps-token-unpinned.md`](../docs/debts/reset-all-keeps-token-unpinned.md) |
| `reset-leaves-sync-unpinned` | No test pins that an armed Reset leaves Sync open. | [`docs/debts/reset-leaves-sync-unpinned.md`](../docs/debts/reset-leaves-sync-unpinned.md) |
| `reset-vs-worker-copy-unmeasured` | A Reset writes an empty ledger with no change times, on the web and on native. | [`docs/debts/reset-vs-worker-copy-unmeasured.md`](../docs/debts/reset-vs-worker-copy-unmeasured.md) |
| `ruled-head-heights-unremeasured` | The figures under "Grid head figures" come from the round-1 builder, and the records writer did not re-measure them. | [`docs/debts/ruled-head-heights-unremeasured.md`](../docs/debts/ruled-head-heights-unremeasured.md) |
| `screens-45px-width-flake` | On a pull request run of the `screens` job (CI run 40463555687), every touch target measured 45px wide at all 7 states at 375px, and "This device has no sync key" measured 45x36. | [`docs/debts/screens-45px-width-flake.md`](../docs/debts/screens-45px-width-flake.md) |
| `seed-in-public-history` | The seed is readable in `index.html` history from `10f9499` to the commit before `82e45d4`, and erasing it needs a history rewrite and the owner's word. | [`docs/debts/seed-in-public-history.md`](../docs/debts/seed-in-public-history.md) |
| `sim-test-diagnose-and-pin` | After a failed UI test, `xcodebuild test` runs `simctl diagnose` on its own, for up to 600 s. | [`docs/debts/sim-test-diagnose-and-pin.md`](../docs/debts/sim-test-diagnose-and-pin.md) |
| `suite-hang-cause-unmeasured` | The cause of the 13-minute hang is unmeasured, and so are the exit codes of the UTC and machine-zone runs. | [`docs/debts/suite-hang-cause-unmeasured.md`](../docs/debts/suite-hang-cause-unmeasured.md) |
| `sweep-settle-masks-30-13-stall` | The `SWEEP_WAIT` settle after 19.6 hides a stall at 30.13, and it does not explain it. | [`docs/debts/sweep-settle-masks-30-13-stall.md`](../docs/debts/sweep-settle-masks-30-13-stall.md) |
| `sync-latency-after-fix-unmeasured` | No run of the probe covers lane web/sync-latency. | [`docs/debts/sync-latency-after-fix-unmeasured.md`](../docs/debts/sync-latency-after-fix-unmeasured.md) |
| `tally-audit-contrast-flags` | Three Tally audits report "Contrast failed" on small text and "Potentially inaccessible text" with no element: `TallyUITests.testAccessibilityAuditTallyScreenWithRows`, `TallyUITests.testAccessibilityAuditTallyScreenWithARowOpen` and `PackagesShellUITests.testAccessibilityAuditTallyScreen`. | [`docs/debts/tally-audit-contrast-flags.md`](../docs/debts/tally-audit-contrast-flags.md) |
| `tally-card-moves-at-320px` | At 320px the Tally card moves 14px on check-ins 1 and 6. | [`docs/debts/tally-card-moves-at-320px.md`](../docs/debts/tally-card-moves-at-320px.md) |
| `tcgplayer-link-opens-history-list` | The order id link opens `orderhistory?SearchString=<id>`, the URL the owner gave on 2026-10-21 (`tcgplayerOrderUrl` encodes the id). | [`docs/debts/tcgplayer-link-opens-history-list.md`](../docs/debts/tcgplayer-link-opens-history-list.md) |
| `tests-33-35-40-45-cannot-fail` | Tests 33.35, 33.40 and 33.45 cannot fail on a plausible mutant. | [`docs/debts/tests-33-35-40-45-cannot-fail.md`](../docs/debts/tests-33-35-40-45-cannot-fail.md) |
| `token-state-and-bundle-unpinned` | Nothing pins the React-state or bundle guarantees. | [`docs/debts/token-state-and-bundle-unpinned.md`](../docs/debts/token-state-and-bundle-unpinned.md) |
| `tracking-checker-unbuilt` | Today the app does not check tracking numbers. | [`docs/debts/tracking-checker-unbuilt.md`](../docs/debts/tracking-checker-unbuilt.md) |
| `type-floor-unbuilt` | Some labels are smaller than the 10px floor today. | [`docs/debts/type-floor-unbuilt.md`](../docs/debts/type-floor-unbuilt.md) |
| `universal-link-unbuilt` | Neither the link handler nor the Worker route that serves the apple-app-site-association file exists. | [`docs/debts/universal-link-unbuilt.md`](../docs/debts/universal-link-unbuilt.md) |
| `web-armed-restore-moves` | In the web History panel (`src/app.jsx`, the armed version row), arming Restore inserts Cancel before it, so Restore's leading part moves right and a second tap there lands on Cancel. | [`docs/debts/web-armed-restore-moves.md`](../docs/debts/web-armed-restore-moves.md) |
| `web-photos-have-no-backup` | Web photos go to the Worker's `/photos` route. | [`docs/debts/web-photos-have-no-backup.md`](../docs/debts/web-photos-have-no-backup.md) |
| `web-reads-no-worker-snapshots` | Web does not read the Worker `/snapshots` or `/kept` routes. | [`docs/debts/web-reads-no-worker-snapshots.md`](../docs/debts/web-reads-no-worker-snapshots.md) |
| `worker-two-device-proof-unrun` | No written proof runs two devices against the Worker merge, so the first real two-device case is unchecked. | [`docs/debts/worker-two-device-proof-unrun.md`](../docs/debts/worker-two-device-proof-unrun.md) |

## Invariants

| Slug | Gist | Link |
|---|---|---|
| `imports-merge-never-replace` | Imports merge, never replace | [`invariants/imports-merge-never-replace.md`](../invariants/imports-merge-never-replace.md) |
| `no-layout-shift-under-pointer` | No layout shift under the pointer | [`invariants/no-layout-shift-under-pointer.md`](../invariants/no-layout-shift-under-pointer.md) |
| `no-native-dialogs` | No native browser dialogs | [`invariants/no-native-dialogs.md`](../invariants/no-native-dialogs.md) |
| `orphaned-mail-never-decides` | Orphaned mail never decides anything | [`invariants/orphaned-mail-never-decides.md`](../invariants/orphaned-mail-never-decides.md) |
| `parser-filters` | Parser keeps only TCG purchases | [`invariants/parser-filters.md`](../invariants/parser-filters.md) |
| `saved-state-shape` | Saved-state shape is fixed | [`invariants/saved-state-shape.md`](../invariants/saved-state-shape.md) |
| `storage-keys-are-frozen` | Storage keys are frozen | [`invariants/storage-keys-are-frozen.md`](../invariants/storage-keys-are-frozen.md) |
| `the-token-is-a-credential` | The GitHub token and the device key are credentials | [`invariants/the-token-is-a-credential.md`](../invariants/the-token-is-a-credential.md) |

## Measurements

| Slug | Gist | Link |
|---|---|---|
| `card-reserved-geometry` | Card reserved geometry heights | [`measurements/card-reserved-geometry.md`](../measurements/card-reserved-geometry.md) |
| `duo-fold-and-keyboard` | Fold strip, keyboard frame and outer screen on the iPhone Duo simulator | [`measurements/duo-fold-and-keyboard.md`](../measurements/duo-fold-and-keyboard.md) |
| `ledger-and-seed-sizes` | Ledger and version sizes | [`measurements/ledger-and-seed-sizes.md`](../measurements/ledger-and-seed-sizes.md) |
| `masthead-foot-slot` | Masthead foot save-slot width | [`measurements/masthead-foot-slot.md`](../measurements/masthead-foot-slot.md) |
| `motion-timings` | Motion sheet durations and beats | [`measurements/motion-timings.md`](../measurements/motion-timings.md) |
| `native-card-load-time` | Native Packages load time | [`measurements/native-card-load-time.md`](../measurements/native-card-load-time.md) |
| `palette-contrast` | Palette token contrast ratios | [`measurements/palette-contrast.md`](../measurements/palette-contrast.md) |
| `ruled-head-heights` | Ruled head control region heights | [`measurements/ruled-head-heights.md`](../measurements/ruled-head-heights.md) |
| `suite-size` | Test suite assertion count and run time | [`measurements/suite-size.md`](../measurements/suite-size.md) |
| `switch-thirds-and-seal` | View switch, seal, and tally headroom | [`measurements/switch-thirds-and-seal.md`](../measurements/switch-thirds-and-seal.md) |
| `sync-latency` | Sync delay from a tap on one device to the row on the other | [`measurements/sync-latency.md`](../measurements/sync-latency.md) |
