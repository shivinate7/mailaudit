# The build check compares code, and ignores the seed

The committed page carries two things: the bundle, and a snapshot of the ledger read at build time. Only the bundle is a claim about the repository. The ledger snapshot changes on its own schedule between builds. Comparing whole pages would fail every time in continuous integration. It would also fail at random on a machine racing the phone's own sync. A check that cries wolf trains people to ignore the alarm. So the build check strips the seed from both sides before comparing.

## The argument, as recorded

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
```

## See also

- `check-seed-backstop-not-proof` — the other half of the same check, on what the seed publishes
- `the-public-seed` — the seed this check strips before comparing
- `ledger-remote-needed-for-seed-build` — why a build can come out seedless
