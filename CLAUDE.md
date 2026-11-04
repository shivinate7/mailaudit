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

This file is an index, and it holds no argument of its own. Rulings sit in records:
`git-one-record-per-question` (one record per question) and `speak-rewrite-superseded-in-place`
(current text only; git keeps the history). Read only the records a task needs
(`tokens-never-load-whole-doc`: one record or section at a time).

- `invariants/` holds a rule that must not break. 8 records.
- `docs/decisions/` holds a ruling and the reason it still holds.
- `measurements/` holds a measured figure and how to re-measure it. 11 records.
- `docs/debts/` holds one known gap per file, each pointing at its decision.
- `docs/plans/` holds work not yet shipped. `docs/specs/` holds how a shipped feature works now. `docs/todo.md` holds tasks a session caught and did not do. `.claude/rules/` holds rules for one folder.

Cite by slug, never by path (`git-cite-by-id`: ids, not paths), so a record survives a
move. `npm run check:records` proves eight things. CLAUDE.md and the files in
`.claude/rules/` cite every record. Every citation resolves. No slug repeats. No fence is broken. Every record
carries its shape. Every invariant names the test that pins it. Every decision
holds a Holds-while line, every open thread a Status line, and the index lists
no slug twice. Every debt holds a Status line and a Decision line.

An open question carries a `**Status:**` line. That line is the only thing that
separates a question still open from a ruling already settled, so keep it.

## Working here

One local lesson, because this repo paid for it: the argument that "the ledger repo
is public" stayed the load-bearing reason for a design long after the repo went
private. Verify a claim in this file against the repo before you rely on it. The
claude-settings rules that cover it: `outcomes-decision-is-argument` (decisions as
arguments), `outcomes-stale-decision-protocol` (the stale-decision steps) and
`verification-report-unknown-reads` (check a document's own claims).

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

## Build, CI and assets

What each check asks, and the two traps in the icon pipeline.

- `check-build-ignores-seed` — The build check compares the whole page.
- `ci-filters-guarantee-no-rebuild` — CI filters replace the old no-workflows guarantee.
- `ci-skips-draft-prs` — CI skips draft pull requests, and the rollup with them.
- `milestone-runs-full-suite` — The full Swift suite runs at milestones, by dispatch only.
- `watchdog-catches-silent-failure` — Retired: the owner turned the backup watchdog off.
- `pages-queued-workflow-fix` — A stuck Pages deploy needs a new commit, not a re-run.
- `favicon-is-a-different-drawing` — The favicon is redrawn, not the master shrunk.
- `icon-paths-and-export-gotchas` — Icon paths stay relative, and iOS caches hard.
- `masthead-is-not-project-name` — The masthead is not the project name.
- `main-moves-only-by-pr` — Main moves only by pull request, admins included.
- `screens-checked-headless-in-ci` — Each view is checked headless at 375 and 760px.
- `records-hold-current-text-only` — Records hold current text only; git keeps history.
- `debts-hold-known-gaps` — Known gaps live in debts, one file each. Caught tasks live in `docs/todo.md`.
- `records-name-what-dates-them` — Each decision names the fact that would date it.
- `readme-is-minimal` — The README is minimal, and carries no license.
- `orchestrator-may-merge` — The batch runner batches and merges green, reviewed PRs.
- `session-tiers-adopted` — This repo runs the session tiers, with the record branch `roadmap`.
- `invariants-cited-by-slug` — Invariants are cited by slug, never by number.

## Reference

A fact an agent needs, that argues nothing. Read the CSV record before touching the parser.

- `assets-and-icons` — Icon files and how to export them.
- `build-and-deploy` — Build, test and deploy commands, and `ios-ship testflight`.
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

## More index, by folder

- `.claude/rules/native.md`: the native client and its debts.
- `.claude/rules/debts.md`: the known gaps outside the native app.
- `.claude/rules/testing.md`: the testing method and the test harness.
- `.claude/rules/screens.md`: the screen rules.

Each file loads when a session reads a file its `paths:` list names. That list is the only home of its globs.

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

The steps and the traps live in `build-and-deploy`. The rules are claude-settings
`git-main-only-by-pr` (main moves by pull request) and local record `main-moves-only-by-pr`
(the required check), so `deploy` opens a PR rather than pushing.
