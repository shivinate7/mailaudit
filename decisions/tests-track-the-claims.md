# Tests track the claims they pin

A behaviour that changes on purpose changes its assertion and its prose in one commit. This record maps each test group to the record that holds its claim. Read it before you change a behaviour. It shows which assertion to update.

**Holds while:** `test/app.test.mjs` opens each group with a banner such as `/* ── 20.` and labels each assertion with its id, such as `42.3` or `38b.4`.

## Claims and their groups

- Orphaned mail hides controls that do not apply, ranks candidates without deciding, and assigns only what was recorded: groups 2 to 4 and 6. Held by `orphaned-mail-never-decides`.
- Partial quantities: group 20. Held by `testing-partial-qty-needs-case`.
- Both backups, both restore paths, and the photo sweep. Held by `feature-map` and `photo-sweep-two-guards`.
- GitHub push and pull, with conflict, force, expired key and offline cases: groups 25 to 27. Held by `sha-accepted-only-after-apply`, `stale-push-conflict-pull-two-tap` and `remote-rules-fail-quietly`.
- Entity decoding on seller names, through a real CSV import: group 29. Held by `orderwand-csv`.
- Showing starts on Unreceived, and a resume counts as reopening: groups 12 and 40. Held by `ruled-head-showing-unreceived` and `ruled-head-resume-is-reopening`.
- Getting from a search hit to the whole order: group 32. Held by `search-filters-inside-package`, `a-reveal-ignores-hidedone-too` and `order-id-button-stops-propagate`.
- The two-device merge: groups 33 and 34. Held by `two-device-merge-proven-first` and `merge-rules-only-add`.
- Auto-push: group 34. Held by `auto-push-safe-as-merge-exists`.
- Sync and the repair line: groups 28 and 38b. Held by `ruled-head-one-advisory-entrance`.
- Action row: group 36. Held by `feature-map`.
- Order stamps: group 37. Held by `one-stamp-per-package`, `a-refund-leaves-every-count`, `stamp-removal-writes-a-tombstone` and `stamped-package-hides-lost-flag`.
- Saved versions, milestones and history: groups 38, 39 and 41. Held by `version-tiers-are-unioned`, `milestones-taken-before-risk`, `a-restore-is-not-local` and `older-versions-come-off-branch`.
- The card that does not change height: group 44. Held by `card-the-bar-is-out-of-flow` and `card-the-action-row-is-reserved`.
- The save indicator's reserved slot: group 42. Held by `masthead-save-slot-reserved`.
- Motion and the joy pass: group 43. Held by `motion-use-just-became` and `motion-the-switch-is-one-object`.
- A device that only merges is still backed up: group 45. Held by `ruled-head-stale-clock-agreement`.
- The masthead's running head: group 21. Held by `masthead-running-head-sticky`.
- The older package and Tally views. Held by `tally-pools-on-the-exact-name` and `feature-map`.

## See also

- `testing-partial-qty-needs-case`, the rule that group 20 must stay.
- `testing-chokepoint-two-branches`, the lesson group 37 taught.
