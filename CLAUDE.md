# Mail Day Ledger

A single-page tool for checking off TCGplayer card orders as the mail arrives. The
owner buys hundreds of low-cost cards from many sellers. The app reads OrderWand
CSV exports of that order history. It gives one checklist. Mark a card as
received, see what is outstanding and what it cost, and flag mail that may be
lost.

Three views read the same check-in data. **Packages** pairs an order with a
seller, and it is the working view for when the mail comes. **Tally** pools one product name
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

Cite by slug (rule:git-cite-by-id). `npm run check:records` proves the corpus; its claims head `check-records.mjs`.

An open question carries a `**Status:**` line. That line is the only thing that
separates a question still open from a ruling already settled, so keep it.

## Working here

Verify this file against the repo (rule:verification-report-unknown-reads, rule:outcomes-decision-is-argument). A decision that looks stale follows rule:outcomes-stale-decision-protocol.

## Invariants

Eight rules. Breaking one costs the owner months of check-in data.

- `imports-merge-never-replace` — Imports merge, never replace.
- `no-layout-shift-under-pointer` — No layout shift under the pointer.
- `no-native-dialogs` — No native browser dialogs.
- `orphaned-mail-never-decides` — Orphaned mail never decides anything.
- `parser-filters` — Parser keeps only TCG purchases.
- `saved-state-shape` — Saved-state shape is fixed.
- `storage-keys-are-frozen` — Storage keys are frozen.
- `the-token-is-a-credential` — The device key and any stored GitHub token are credentials.

## Storage and the platform layer

Nothing in the component touches a storage API. Three adapters do, and each fails in its own way.

- `single-file-architecture` — One component file, one platform layer.
- `storage-split-three-adapters` — The component never touches a storage API directly.

## Process

- `masthead-is-not-project-name` — The masthead is not the project name.
- `main-moves-only-by-pr` — Main moves only by pull request, admins included.
- `records-hold-current-text-only` — Records hold current text only; git keeps history.
- `debts-hold-known-gaps` — Known gaps live in debts, one file each. Caught tasks live in `docs/todo.md`.
- `records-name-what-dates-them` — Each decision names the fact that would date it.
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
- `nothing-recovers-without-the-key` — A fresh device needs its device key to recover.
- `photos-in-git-are-permanent` — Photos are permanent in git and in the Worker.
- `ledger-private-source-public` — The ledger repo is private, the source repo is public.
- `token-sits-on-shared-origin` — The device key sits on a shared origin.
- `vendor-toggle-undecided` — The vendor toggle stays undecided.
- `merge-later-change-wins` — Clock skew can pin a merge key. Accepted risk.

## Measurements

Each figure was measured in a real viewport or on a real device. A test cannot hold most of them, and each record says how to take the number again. Their index lines live with their subjects in `.claude/rules/`: `native.md`, `screens.md`, `testing.md`, `sync.md` and `versions.md`.

## Build and deploy

Commands, checks and traps: `build-and-deploy`. iOS installs first, TestFlight as fallback: `native-ships-via-testflight`. `npm run deploy` opens a pull request rather than pushing: `git-main-only-by-pr` (main moves by pull request) and `main-moves-only-by-pr` (the required check).
