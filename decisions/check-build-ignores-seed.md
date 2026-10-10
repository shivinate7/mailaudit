# The build check compares code, and ignores the seed

The build check, `check:build`, compares code and ignores the seed. This is the design, not a gap.

**Holds while:** `withoutSeed()` in `build.mjs` strips the seed from both sides, and `.github/workflows/test.yml` runs `check:build` on a default checkout.

`index.html` carries two things. One is the bundle. The other is a snapshot of the ledger, read off `origin/data` at build time. Only the bundle is a claim about this repository. The seed cannot be compared, even in principle. The phone rewrites `data` on a 90s idle debounce. So two builds minutes apart legitimately differ.

Diffing whole pages fails in one of two ways. In CI, it fails always. `actions/checkout` is single-branch, so the runner has no `origin/data`. It builds seedless, and every comparison differs. `main` was red for four runs on exactly this, while `npm test` itself passed. The other way is failure at random. You get it by fetching the branch and racing the phone. A check that cries wolf is worse than no check. It trains you past the alarm.

So `withoutSeed()` strips the seed from both sides before comparing. It lives in `build.mjs`, beside the template that writes the tag. The two cannot drift apart. If the tag's shape changes without `withoutSeed()` following, the check says so by name. It does not quietly compare nothing.

A stale seed is harmless. A stale code is not. A visitor sees a slightly older ledger, and the next deploy refreshes it.

Verified all three ways in an isolated checkout:

- A clean tree with no `origin/data` (CI's exact condition) exits 0.
- A source change with no rebuild exits 1, saying "index.html is stale".
- A drifted tag shape exits 1, naming `withoutSeed()`.

## See also

- `check-seed-backstop-not-proof` — the other half of the same check, on what the seed publishes
- `the-public-seed` — the seed this check strips before comparing
- `ledger-remote-needed-for-seed-build` — why a build can come out seedless
