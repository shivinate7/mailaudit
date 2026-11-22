# The app is designed for three phone forms

Kind: process

Home: docs/decisions/phone-forms-and-mockup-size.md

**Status:** ruled 2026-11-21 19:57 CST. Owner, page item 109 (phone size), answer "none of these": "just need to worry about iphone 18, iphone max, and iphone duo form factors frankly -- and mockups should all just be iphone duo folded size frankly". Open to the owner: the new-only reading of "every mockup" below is the coordinator's.

The app is designed for three phone forms: iPhone 18, iPhone Max and iPhone Duo. The owner's words: "just need to worry about iphone 18, iphone max, and iphone duo form factors frankly" (page item 109, 2026-11-21 19:57 CST). No measurement in this repo gives a width for iPhone 18 or iPhone Max.

New mockups are folded-Duo only: the iPhone Duo at its folded size, 466 by 678 pt, the outer screen with the fold closed (measurement `duo-fold-and-keyboard`). Mockups made before this ruling are history. This is the coordinator's reading of item 109's "every mockup": new mockups only, open to the owner. On main, `docs/design-churn` (measured 2026-11-22 00:55 CST at origin/main `2cad5f81`) holds 140 HTML files. 133 of them carry `iphone-duo-unfolded`. 37 name 402 by 874, 440 by 956, 430 by 900 or 375 by 812 points, and 20 more name 390 by 844 or 430 by 932 points. No file is in both groups. They stay there for review and culling.

Counting rule: a file counts for a pair when the two whole numbers are joined by `x`, `×`, `by` or the HTML entity for × (`&times;`, `&#215;`, `&#x00d7;`), with zero or one space on each side, and no digit touches either number. Run these in the repo root; each prints its count after the hash.

```
X='(x|×|by|&times;|&#215;|&#x00d7;)'
FOUR="(?<![0-9])(402 ?$X ?874|440 ?$X ?956|430 ?$X ?900|375 ?$X ?812)(?![0-9])"
TWO="(?<![0-9])(390 ?$X ?844|430 ?$X ?932)(?![0-9])"
git ls-tree -r --name-only origin/main -- docs/design-churn | grep -c '\.html$'      # 140
git grep -l iphone-duo-unfolded origin/main -- 'docs/design-churn/*.html' | wc -l    # 133
git grep -l -P "$FOUR" origin/main -- 'docs/design-churn/*.html' | wc -l             # 37
git grep -l -P "$TWO" origin/main -- 'docs/design-churn/*.html' | wc -l              # 20
```

**Holds while:** `duo-fold-and-keyboard` gives the folded outer screen as 466 by 678 pt, and the ruling above stands.

**Pinned by:** no test pins the forms. `npm run check:screens` runs at 402 px, 440 px and 466 px, the three forms, and claim 17a runs at each form too (`test/screens.mjs`).

**Not yet in line:**

- The shared iOS skill (`ios-apps`, Mockups) still asks for the unfolded Duo pose too. It lives outside this repo.
- The designer agent file of claude-settings: line 42 ("draw both Duo poses") and line 57 ("every size and theme") still ask a new mockup for both poses and every size. It lives outside this repo.
- The glossary of claude-settings, row "mockup" (line 89), still says "at every size and theme". It lives outside this repo.
- History, no change asked: the open-pose Duo pages in `docs/design/`, the `duo-hand-*` pages and `orphaned-meta-line-wraps.html` lines 150 and 263, were last changed 2026-11-08, before this ruling.

## See also

- `duo-fold-and-keyboard` — the measured folded and open Duo figures.
- `duo-card-in-hand` — the Duo layout and its mockup poses.
- `design-view-switch-equal-thirds` — holds the phone-width sentence that points here.
- `card-the-action-row-is-reserved` — the 320 px case this ruling leaves out.
