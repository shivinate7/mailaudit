# Build, test and deploy commands

This file holds the npm scripts, what each asks, and the deploy sequence, plus the Pages queued-workflow quirk.

**Holds while:** `withoutSeed()` in `build.mjs` strips the seed from both sides of `check:build`. `test.yml` never fetches the `data` branch.

## The npm scripts

```
npm install
npm run build         # -> index.html
npm test              # behaviour suite, must be green before deploying
npm run serve         # optional local server on :4173
npm run check:build   # is the committed index.html the code in this repo?
npm run check:seed    # and what does the seed baked into it publish?
npm run check:docs    # do the corpus's published numbers and paths hold?
npm run check:records # do the records' citations and fences hold?
npm run check:screens # screen verdicts in a real browser
npm run deploy        # build + test, then a branch holding only index.html, pushed, with a PR to main
```

## Why check:build ignores the seed, and the Pages quirk

`check:build` compares the code and ignores the seed. That is the design, not a gap. `index.html` carries two things. One is the bundle. The other is a snapshot of the ledger, read off `origin/data` at build time. Only the bundle is a claim about this repo. The snapshot cannot be compared, even in principle. The phone rewrites `data` on a 90s idle debounce. Two builds made minutes apart legitimately differ.

Diffing whole pages fails in one of two ways. CI hits the first way **always**. `actions/checkout` is single-branch, so the runner has no `origin/data`. It builds seedless, and every comparison differs. Main was red for four runs on exactly this, while `npm test` itself passed. The second way is **at random**. A fetch of the branch that races the phone causes it. A check that cries wolf is worse than no check. It trains you to ignore the alarm.

So `withoutSeed()` strips the seed from both sides. It lives in `build.mjs`, beside the template that writes the tag, so the two cannot drift apart. If the tag's shape changes without `withoutSeed()` following, the check names `withoutSeed()` and fails. It never compares nothing quietly.

A stale seed is harmless. A visitor sees a slightly older ledger, and the next deploy refreshes it. A stale code build is not harmless. Three checks verified this in an isolated checkout:

- A clean tree with no `origin/data` (CI's exact condition) exits 0.
- A source change with no rebuild exits 1 and says "index.html is stale".
- A drifted tag shape exits 1 and names `withoutSeed()`.

GitHub Pages serves from the main branch root. Quirk: if the Pages workflow sits Queued >10 min, do not re-run the same run. Cancel it, and push a trivial commit to start a fresh run.

`npm run deploy` fetches the ledger branch for the seed, builds, runs the suite, then switches to a new branch named `deploy/<YYYYMMDDHHMMSS>-<pid>` and commits only `index.html` there. It pushes that branch, opens a pull request to main, and, only if every step succeeded, switches back to the branch you started on. Pages deploys when that PR merges. You must commit source and doc changes yourself first.

## See also

- `check-build-ignores-seed`, why the check strips the seed before comparing.
- `check-seed-backstop-not-proof`, what `check:seed` can and cannot catch.
- `data-branch-setup`, the branch this build reads its seed from.
- `pages-queued-workflow-fix`, the record for the queued-run quirk.
