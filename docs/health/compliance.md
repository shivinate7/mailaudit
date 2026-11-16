# Compliance scorecard

Rewritten in place on each run by compliance-check.

| Group | Score | Gold standard | Gap | Source |
| --- | --- | --- | --- | --- |
| Outcomes | in shape | in shape | CLAUDE.md and README name the owner; ste_lint 405 md files, 0 errors, 26 warnings; restates in shape | CLAUDE.md:1-9, ste_lint, compliance_probes restates |
| Roles | in shape | in shape | no settings.local.json model raise; test commits precede product commits | git log -40 origin/main |
| Parallelism | in shape | in shape | 5 worktrees under .claude/worktrees, ignored at .gitignore:5 | git worktree list |
| Shared trees | in shape | in shape | stash empty; dev-server.mjs:18 takes its port from argv | git stash list |
| Git | in shape | in shape | 93 of 93 first-parent commits on main are merged PRs; protection contexts equal .github/stamp.json requiredChecks, enforce_admins true | gh api branches/main/protection |
| Verification | out | in shape | Playwright install runs apt; three bounded waiter loops | compliance_probes playwright |
| Tokens | n/a | in shape | session practice; read-map-first does not apply, no map.config.json | probes.md |
| Building | partial | in shape | 9 product files have no covering suite by tier 1 or 2 | scripts/tests-for.mjs |
| Speak plainly | partial | in shape | 9 lines of numbered or keyword ids, 46 PR or lane id lines in 29 files with no plain name | docs/decisions/native-build-lanes.md:3, docs/decisions/native-parity-table.md:9 |
| Output | partial | in shape | STE 0 errors; known gap: 20 UI files get no STE check | ste_lint, compliance_probes design |
| Reports | parent-covered | in shape | report_guard.py | probes.md |
| Style | n/a | in shape | session practice | probes.md |
| Layout | in shape | in shape | rolled-out true, public; extension kind present since PR 346 | compliance_probes layout |
| Design | partial | in shape | probe in shape; one skill step has no file | compliance_probes design |
| Copies | in shape | in shape | no copies | find_copies.py exit 0 |
| iOS | out | in shape | one gap | compliance_probes ios |
| Words | in shape | in shape | no retired words, glossary read at claude-settings e443aea | compliance_probes words |
| Supersede | in shape | in shape | 11 files read, no hits | compliance_probes supersede |
| STE lint on UI files | partial | in shape | UI text the lint does not read: known gap, no UI linter | lint/ui_suffixes.py |

## Notes

- Caution (listing for the owner to prune; no rule is marked blocks own login): CLAUDE.md:43 "the-token-is-a-credential: The device key and any stored GitHub token are credentials."
- Caution: CLAUDE.md:84 "ledger-private-source-public: The ledger repo is private, the source repo is public."
- Caution: CLAUDE.md:83 "photos-in-git-are-permanent: Photos are permanent in git and in the Worker."
- Caution: .claude/rules/sync.md:46 "token-lives-outside-namespace: The device key and any stored GitHub token sit outside the storage namespace."
- Caution: .claude/rules/photos.md:11 "A photo is a picture of a mailing label. It never enters the ledger, and it can never lose a conflict."
- Rules no probe or mechanism covers: 77 session-practice rules (outcomes, roles, parallelism, tokens, building, output, reports, style groups); the lane's report names them by group.
- Docs staleness (fresh-prose): top finding is README.md:7 Status line with no check on it.
- - slugs over 32 characters: partial - 6 old slugs on main, note only (compliance_probes slugs)
- - silent-undo history: unknown - history is shallow (check_silent_undo.py --repo . --history)
- - merged-PR list: unknown - GraphQL 403, the REST pulls list was read instead (gh pr list)
- - playwright: gap - docs/plans/cloud-setup.sh:35 playwright install --with-deps; move to actions/playwright-setup (compliance_probes playwright)
- - waiter loops: gap - scripts/ci-sim.sh:88-92, scripts/screen-check.sh:265-267, test/app.test.mjs:1858-1861 (git grep -w sleep)
- - ci-hygiene claude-settings pins: pass - 7 uses sit at @stable, which owner ruling R44 A (child repos follow @stable) rules correct (.github/workflows/checks.yml:389)
- - ci-hygiene milestone-proof: gap - runs on PRs but is off the all-jobs-passed needs, stated provisional (.github/workflows/checks.yml:421-424)
- - screens: pass - Packages, Tally and Orphaned checked at 375 and 760, light only (test/screens.mjs:14)
- - tests: partial - no suite: dev-server.mjs, extension/{background,badge-colors,build-icons,options,pull.entry}.mjs, scripts/{check-golden,copy-photos-to-worker}.mjs, worker/orders.mjs; only pull.entry.mjs and copy-photos-to-worker.mjs are named by no test or npm script (scripts/tests-for.mjs)
- - copies: pass - no copies of claude-settings things (find_copies.py exit 0)
- - screens named: pass - 1 route, Packages-empty (.claude/shoot.json:4)
- - sizes and themes named: pass - [375, 760], light only (.claude/shoot.json)
- - ui copy: partial - 20 UI files have no STE check, a known gap (compliance_probes design)
- - checklist marks: gap - docs/design/ has no checklist.md; Tally and Orphaned are not in shoot.json (ls docs/design)
- - slow tests: gap - duo-ui.yml and milestone.yml run UI tests the probe says belong once per batch on the Mac; decision duo-ui-runs-on-pr-label is not read (compliance_probes ios)
- - aligned: unknown - PR-only probe, no BASE_SHA on this branch (compliance_probes aligned)
- Caution: public - no rule restricts Claude's own use of a password, token or login; app-design credential rules listed in Notes (layout.py caution)
