# CI filters replace the old no-workflows guarantee

Nothing the app writes should touch the source repository, so a backup can never trigger a site rebuild. The guarantee used to rest on the absence of `.github/workflows`. Now it rests on the path filters of two workflows. A third workflow must read those filters first.

**Status:** ruled. Lane C1 adds the native and shared paths and has not landed, see `native-build-lanes`.

**Holds while:** the push trigger in `.github/workflows/test.yml` names only `main` and a paths filter, and that filter does not list `index.html`.

## Settings

Settings → Pages on `mailaudit` should read "Deploy from a branch: `main` / `(root)`". Nothing the app writes touches that repo any more. A backup can no longer trigger a site rebuild by construction, not by branch discipline.

## The two workflows

`test.yml` is `branches: [main]` plus a paths filter. Nothing under `src/` or `test/` ever changes on `data`, which carries one file. It deliberately does not trigger on `index.html`. `npm run deploy` commits that page separately. Re-running the suite on the build output would double every deploy for no new information.

`test.yml` also checks that the committed `index.html` still matches what the sources build. A local deploy can skip that check by accident. The check runs `check:build`, which compares the code and ignores the seed. The seed cannot be compared, because the phone rewrites `data` on a 90s idle debounce, so two builds minutes apart legitimately differ.

A second step runs `check:seed`. It decodes the seed the committed page actually carries and refuses anything outside `SEED_KEEP`. The two steps together ask whether the page is this repo's code, and then what its data publishes.

## The native and shared paths

Lane C1 adds `native/**` and `shared/**` to the push paths of `test.yml`. Nothing under either folder ever changes on `data`, which carries one file. So the guarantee holds.

- The folder shared holds the token file that the web build imports. A change there must run the suite and `check:build`.
- The folder native holds the Swift sources and the native job runs on them, see `native-ci-on-hosted-macos`.
- The filter still does not list `index.html`.

## See also

- `native-ci-on-hosted-macos` — the job that the new paths trigger.
- `one-repo-for-both-halves` — why the source repository must stay untouched by a backup
- `check-build-ignores-seed` — the check one of these workflows runs
- `watchdog-catches-silent-failure` — the other scheduled workflow in the private repository
