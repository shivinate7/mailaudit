# Build, test and deploy commands

This file holds the npm scripts, what each asks, and the deploy sequence, plus the Pages queued-workflow quirk.

## The build and deploy section

```
## Build & deploy
```

## The npm scripts

```
npm install
npm run build        # -> index.html
npm test             # behaviour suite, must be green before deploying
npm run serve        # optional local server on :4173
npm run check:build  # is the committed index.html the code in this repo?
npm run check:seed   # and what does the seed baked into it publish?
npm run deploy       # build + test + commit index.html + push (Pages auto-deploys)
```

## Why check:build ignores the seed, and the Pages quirk

```
**`check:build` compares the code and ignores the seed, and that is the design
rather than a gap.** `index.html` carries two things — the bundle, and a
snapshot of the ledger read off `origin/data` at build time — and only the
first is a claim about this repo. The second cannot be compared even in
principle: the phone rewrites `data` on a 90s idle debounce, so two builds
minutes apart legitimately differ. Diffing whole pages therefore fails one of
two ways, and CI managed the first — **always**, because `actions/checkout` is
single-branch, so the runner has no `origin/data`, builds seedless, and every
comparison differs (main was red for four runs on exactly this, while
`npm test` itself passed); or **at random**, if you fetch the branch and race
the phone. A check that cries wolf is worse than no check, because it trains
you past the alarm.

So `withoutSeed()` strips the seed from both sides. It lives in `build.mjs`,
beside the template that writes the tag, so the two cannot drift apart — and if
the tag's shape ever changes without it following, the check says so by name
instead of quietly comparing nothing. A stale *seed* is harmless in a way stale
*code* is not: a visitor sees a slightly older ledger and the next deploy
refreshes it. Verified all three ways in an isolated checkout: a clean tree with
no `origin/data` (CI's exact condition) exits 0; a source change with no rebuild
exits 1 saying "index.html is stale"; and a drifted tag shape exits 1 naming
`withoutSeed()`.

GitHub Pages serves from main branch root. Deploy quirk learned the hard way:
if the Pages workflow sits Queued >10 min, don't re-run the same run — cancel
it and push a trivial commit to spawn a fresh run.

Note `npm run deploy` only commits `index.html`; source and doc changes have to
be committed yourself first.
```

## See also

- `check-build-ignores-seed`, why the check strips the seed before comparing.
- `check-seed-backstop-not-proof`, what `check:seed` can and cannot catch.
- `data-branch-setup`, the branch this build reads its seed from.
- `pages-queued-workflow-fix`, the record for the queued-run quirk.
