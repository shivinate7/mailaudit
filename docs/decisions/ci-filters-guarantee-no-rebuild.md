# CI filters replace the old no-workflows guarantee

Nothing the app writes should touch the source repository, so a backup can never trigger a site rebuild. The guarantee used to rest on the absence of `.github/workflows`. Now it rests on the path filters of two workflows. A third workflow must read those filters first.

**Status:** ruled. Lane C1 landed the native and shared paths in PR #76, see `native-build-lanes`.

**Holds while:** the push trigger in `.github/workflows/checks.yml` names only `main` and a paths filter, and that filter does not list `index.html`.

Kind: build

Plan: docs/decisions/ci-filters-guarantee-no-rebuild.md#the-two-workflows (web)

Plan: docs/decisions/ci-filters-guarantee-no-rebuild.md#the-native-and-shared-paths (native)

## Settings

Settings → Pages on `mailaudit` should read "Deploy from a branch: `main` / `(root)`". Nothing the app writes touches that repo any more. A backup can no longer trigger a site rebuild by construction, not by branch discipline.

## The two workflows

`checks.yml` is `branches: [main]` plus a paths filter. Nothing under `src/` or `test/` ever changes on `data`, which carries one file. It deliberately does not trigger on `index.html`. `npm run deploy` commits that page separately. Re-running the suite on the build output would double every deploy for no new information.

`ci-alarm.yml` runs on a nightly schedule and `workflow_dispatch` only, never on a push, so it cannot rebuild the site. It opens or comments on one issue when the newest run of another workflow on main is red.

`checks.yml` also checks that the committed `index.html` still matches what the sources build. A local deploy can skip that check by accident. The check runs `check:build`, which compares the whole page with the build of `src/`.

A second step runs `check:seed`. It refuses a seed tag, a packed data script or a ledger payload in the committed page. The two steps together ask whether the page is this repo's code, and that it publishes no ledger data.

## Doc-only paths and the suite shards

The push filter lists no record or prose path: `invariants/`, `measurements/`, `docs/decisions/`, `docs/debts/`, `CLAUDE.md`, `README.md` and `.claude/rules/`. A push to main follows a pull request whose run already read those files, and the nightly run reads them again. The pull request trigger has no path filter, so `all-jobs-passed` reports on every pull request and on every push that runs. The filter stays a `paths` allowlist, because GitHub allows one of `paths` and `paths-ignore` per event, and an ignore list would start runs for `Makefile`, the icons and `tools/`.

The `suite` job runs as three matrix shards under one job id, so the rollup still needs one job. Each step names its shard, and shard 1 holds the one suite run with the checks that read its log. Owner order 2026-11-13 11:39 CST, "lane each change".

## The native and shared paths

Lane C1 added `native/**` and `shared/**` to the push paths of `checks.yml`. Nothing under either folder ever changes on `data`, which carries one file. So the guarantee holds.

- The folder shared holds the token file that the web build imports. A change there must run the suite and `check:build`.
- The folder native holds the Swift sources and the native job runs on them, see `native-ci-on-hosted-macos`.
- The filter still does not list `index.html`.

## See also

- `native-ci-on-hosted-macos` — the job that the new paths trigger.
- `one-repo-for-both-halves` — why the source repository must stay untouched by a backup
- `check-build-ignores-seed` — the whole-page build check that one of these workflows runs
- `watchdog-catches-silent-failure` — the other scheduled workflow in the private repository
