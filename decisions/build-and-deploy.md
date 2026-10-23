# Build, test and deploy commands

Kind: build

Plan: decisions/build-and-deploy.md#the-npm-scripts (web)

This file holds the npm scripts and what each asks. It also holds what the build writes, the deploy sequence, and the Pages queued-workflow quirk.

**Holds while:** `build.mjs --check` compares the whole committed `index.html` with the build of `src/`, and `test.yml` never fetches the `data` branch.

## The npm scripts

```
npm install
npm run build         # -> index.html and native/ManifestKit/Sources/ManifestKit/rules.js
npm test              # behaviour suite, must be green before deploying
npm run serve         # optional local server on :4173
npm run check:build   # is the committed index.html the code in this repo?
npm run check:seed    # does the built page carry any ledger data?
npm run check:docs    # do the corpus's published numbers and paths hold?
npm run check:records # do the records' citations and fences hold?
npm run check:screens # screen verdicts in a real browser
npm run test:send-key # the send-key script's own test
npm run test:view-rules # the view rules' own test
npm run test:golden   # the golden files' own test
npm run check:golden  # do the golden files match what scripts/gen-golden.mjs writes now?
npm run check:rules   # is the committed rules bundle in step with src/?
npm run test:rules    # the contract tests for check:rules
npm run deploy        # build + test, then a branch holding only index.html and native/ManifestKit/Sources/ManifestKit/rules.js, pushed, with a PR to main
```

`scripts/gen-golden.mjs` is not an npm script. After a change to `src/view-rules.mjs`, run `node scripts/gen-golden.mjs` to rewrite the golden files. `npm run check:golden` fails until you do.

`scripts/send-key.mjs` is not an npm script. Run it with node and one argument. The argument `mac` opens the sync link on this Mac. The argument `iphone` shows a QR code for the iPhone. The key rules live in `sync-revamp-cloudflare`.

## What the build writes

`build.mjs` bundles `src/entry.jsx` with esbuild. It inlines the JavaScript into a self-contained `index.html`, with iOS home-screen-app meta tags. `index.html` is the build output, and it is committed to the repo. `build.mjs` also writes `native/ManifestKit/Sources/ManifestKit/rules.js`, the rules bundle the Swift client loads. It is committed beside `index.html`. When the bundle is stale, `check:rules` goes red. See `rules-run-in-javascriptcore`, why the bundle exists. GitHub Pages serves it at https://shivinate7.github.io/mailaudit/. The owner runs it as an iOS home-screen web app. `dev-server.mjs` is the optional static server behind `npm run serve`.

## make testflight

`make testflight` is the iOS fallback path, run on this Mac when the Mac install fails. The ruling is `native-ships-via-testflight`. It is a Makefile because the steps are `xcodebuild` calls, not npm work. It builds the rules bundle, runs `xcodegen generate`, archives Release for `generic/platform=iOS` with a UTC-minute build number, then exports to App Store Connect (`native/ExportOptions.plist`). `make archive` stops after the archive. The upload runs once and is never retried. The API key at `~/.appstoreconnect/private_keys` is passed by path and never read.

## Why check:build compares the whole page, and the Pages quirk

`check:build` compares the whole committed `index.html` with the build of `src/`. The page is built from `src/` alone, and it carries no ledger data (`the-public-seed`). So the whole page is a claim about this repo. The seed-stripping design is retired (`check-build-ignores-seed`).

A source change with no rebuild exits 1 and says "index.html is stale".

GitHub Pages serves from the main branch root. Quirk: if the Pages workflow sits Queued >10 min, do not re-run the same run. Cancel it, and push a trivial commit to start a fresh run.

`npm run deploy` builds, runs `check:seed`, and runs the suite. Then it makes a branch named `deploy/<YYYYMMDDHHMMSS>-<pid>` and commits only `index.html` and `native/ManifestKit/Sources/ManifestKit/rules.js` there. It pushes that branch and opens a pull request to main. If every step succeeded, it switches back to the branch you started on. When that PR merges, Pages deploys. You must commit source and doc changes yourself first.

## See also

- `check-build-ignores-seed`, why `check:build` compares the whole page.
- `check-seed-backstop-not-proof`, what `check:seed` can and cannot catch.
- `data-branch-setup`, the branch the ledger lives on. No build reads it now.
- `pages-queued-workflow-fix`, the record for the queued-run quirk.
- `rules-run-in-javascriptcore`, why the rules bundle exists and what it holds.
- `native-ships-via-testflight`, the ruling behind `make testflight`, and the build-number rule.
