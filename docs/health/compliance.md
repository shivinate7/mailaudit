# Compliance scorecard

Rewritten in place on each run by compliance-check.

| Group | Score | Gold standard | Gap | Source |
| --- | --- | --- | --- | --- |
| Outcomes | in shape | in shape | restates and supersede pass; README staleness deferred by name to fresh-prose, not run | compliance_probes restates |
| Outcomes: restates | pass | in shape | 11 file(s) read, no hits | compliance_probes restates |
| Outcomes: supersede | pass | in shape | 11 file(s) read, no hits | compliance_probes supersede |
| Outcomes: ste_lint CLAUDE.md and README.md | pass | in shape | 0 errors | ste_lint.py --fail-on error |
| Outcomes: local rule anchors | n/a | in shape | CLAUDE.md holds no local rule anchor | grep -c 'rule:' CLAUDE.md |
| Outcomes: README staleness | unknown | in shape | fresh-prose not run here, deferred by name | fresh-prose skill |
| Roles | in shape | in shape | no settings.local.json, so no model raise; test-first order not measured | git log -40 origin/main |
| Roles: settings.local.json | pass | in shape | no file, so no stale model raise | cat .claude/settings.local.json |
| Roles: test commits before product commits | unknown | in shape | no probe measures the order; test-named branches exist on origin | git branch -r |
| Parallelism | in shape | in shape | work runs in worktrees and .claude/worktrees is ignored (.gitignore:5); 112 worktrees on disk | git worktree list |
| Parallelism: worktrees ignored | pass | in shape | .gitignore:5 | grep -n worktrees .gitignore |
| Parallelism: lane cap | pass | in shape | 4 brief or plan file(s) read, no guessed cap | compliance_probes lanecap |
| Shared trees | in shape | in shape | no stash entries; hooks match the parent clone; dev server takes its port from argv | dev-server.mjs:18 |
| Shared trees: stash | pass | in shape | 0 entries | git stash list |
| Shared trees: hooks | pass | in shape | in shape, trusts the clone | compliance_probes hooks |
| Shared trees: webServer reuse and strict port | n/a | in shape | no Playwright config | git ls-files '*playwright*.config.*' |
| Git | in shape | in shape | record folders and slugs pass; main-by-PR and branch protection unknown, gh not run | compliance_probes slugs |
| Git: record folders and slugs | pass | in shape | none added over 32 characters; 6 old slugs on main, note only | compliance_probes slugs |
| Git: main moves only by PR | unknown | in shape | gh pr list not run; 20 first-parent non-merge commits unverified | git log --first-parent --no-merges |
| Git: branch protection | unknown | in shape | gh api not run, the brief names no gh call | gh api repos/.../branches/main/protection |
| Git: silent undo history | unknown | in shape | check_silent_undo.py --history ran past the run and was stopped | check_silent_undo.py --history |
| Verification | out | in shape | Playwright install runs apt; two sleep-poll waiter loops; CI shape deferred by name | compliance_probes playwright |
| Verification: playwright apt install | gap | in shape | docs/plans/cloud-setup.sh:35 runs install --with-deps | compliance_probes playwright |
| Verification: waiter loops | gap | in shape | scripts/ci-sim.sh:88-92 polls with sleep 2; scripts/screen-check.sh:264-267 polls with sleep 1 | git grep -n sleep |
| Verification: screens | pass | in shape | Packages, Tally and Orphaned checked headless at 402, 440 and 466px; no dark-theme check in the file | test/screens.mjs:8 |
| Verification: CI shape | unknown | in shape | deferred by name to the ci-hygiene skill, not run | ci-hygiene skill |
| Tokens | n/a | in shape | session practice, no trace in the tree | probes.md |
| Building | partial | in shape | 10 product modules have no covering suite by tier 1 or 2 | scripts/tests-for.mjs |
| Building: product modules with a suite | gap | in shape | 10 without a suite: dev-server.mjs, extension/background.mjs, extension/badge-colors.mjs, extension/build-icons.mjs, extension/options.mjs, extension/pull.entry.mjs, extension/pull.js, scripts/check-golden.mjs, scripts/copy-photos-to-worker.mjs, worker/orders.mjs | scripts/tests-for.mjs |
| Building: designs with no record | unknown | in shape | not judged in this run | probes.md, Building |
| Speak plainly | partial | in shape | 10 numbered or keyword id lines and 58 PR or lane id lines in 31 files with no plain name | grep in docs |
| Speak plainly: numbered and keyword ids | gap | in shape | 10 lines, e.g. decisions/spacing-on-4px-grid.md:9 | grep in docs |
| Speak plainly: PR and lane ids | gap | in shape | 58 lines in 31 files with no plain name | grep in docs |
| Speak plainly: bare slugs | unknown | in shape | 2104 hits, each needs a plain name judged by hand; not judged in this run | grep -rnwF in docs |
| Output | partial | in shape | ste_lint has 0 errors on 570 files; known gap: 161 UI files get no STE check | ste_lint.py --fail-on error |
| Output: ste_lint totals | pass | in shape | 570 files, 0 errors, 238 warnings | ste_lint.py --fail-on error, worktrees excluded |
| Output: UI copy | known gap | in shape | 161 UI files get no sentence, bloat or double-negative check | compliance_probes design |
| Reports | parent-covered | in shape | report_guard.py; hooks in shape and guard.log has verdict lines in the last 7 days | guard_log_report.py --days 7 |
| Style | n/a | in shape | session practice; output-styles/shiv-stylisms.md governs replies | probes.md |
| Layout | out | in shape | docs/design-churn/ is neither a layout kind nor an extra | compliance_probes layout |
| Layout: docs/design-churn/ | gap | in shape | neither a layout kind nor an extra; add an extra in .claude/layout-extras.json | compliance_probes layout |
| Design | partial | in shape | screens, sizes, themes, command and tokens pass; docs/design has no checklist.md; UI copy is a known gap | compliance_probes design |
| Design: screens named | pass | in shape | 1 route in .claude/shoot.json | compliance_probes design |
| Design: sizes named | pass | in shape | [375, 760] in .claude/shoot.json, owner choice, left as is | compliance_probes design |
| Design: themes named | pass | in shape | light | compliance_probes design |
| Design: screenshot command | pass | in shape | the shared shoot reads .claude/shoot.json | compliance_probes design |
| Design: token file | pass | in shape | shared/tokens.json, plus one generated | compliance_probes design |
| Design: checklist marks | gap | in shape | docs/design has no checklist.md | ls docs/design |
| Design: ui copy | known gap | in shape | 161 UI files get no STE check | compliance_probes design |
| Copies | in shape | in shape | no copies of claude-settings things | find_copies.py exit 0 |
| Words | in shape | in shape | no retired words; glossary read at f3578d7 of claude-settings | compliance_probes words |
| iOS | out | in shape | UI tests run in duo-ui.yml and milestone.yml on PR CI | compliance_probes ios |
| iOS: make targets | pass | in shape | phone, testflight and native-check | compliance_probes ios |
| iOS: ship path | pass | in shape | phone and testflight call ios-ship | compliance_probes ios |
| iOS: project file | pass | in shape | XcodeGen project at native/project.yml | compliance_probes ios |
| iOS: kit package | pass | in shape | native/ManifestKit/Package.swift | compliance_probes ios |
| iOS: swift 6 | pass | in shape | Swift 6 language mode | compliance_probes ios |
| iOS: ci runner | pass | in shape | macos-26 | compliance_probes ios |
| iOS: ci checks | pass | in shape | package tests and an app compile on each pull request | compliance_probes ios |
| iOS: slow tests | gap | in shape | .github/workflows/duo-ui.yml and milestone.yml run UI tests on PR CI, the probe says once per batch on the Mac | compliance_probes ios |
| iOS: test diagnostics | pass | in shape | every xcodebuild test sets -collect-test-diagnostics never | compliance_probes ios |
| iOS: account ids | pass | in shape | none in the repo | compliance_probes ios |
| Supersede | in shape | in shape | 11 file(s) read, no hits | compliance_probes supersede |
| STE lint on UI files | partial | in shape | UI text the lint does not read: known gap, no UI linter | lint/ui_suffixes.py |

## Notes

- - Caution (listing for the owner to prune, no grade): public. Read each file before commit or publish. Rules that restrict handling of a token, key or personal datum:
- - Caution: CLAUDE.md:43 "The device key and any stored GitHub token are credentials."
- - Caution: CLAUDE.md:83 "Photos are permanent in git and in the Worker."
- - Caution: CLAUDE.md:84 "The ledger repo is private, the source repo is public."
- - Caution: CLAUDE.md:85 "The device key sits on a shared origin."
- - Caution: .claude/rules/sync.md:46 "The device key and any stored GitHub token sit outside the storage namespace."
- - Caution: .claude/rules/photos.md:11 "A photo is a picture of a mailing label. It never enters the ledger, and it can never lose a conflict."
- - Caution: no rule blocks an owner's own low-stakes device login (no Home Assistant or speaker rule in this repo).
- - Carried from the last run, not re-run here: ci-hygiene (CI shape) milestone-proof gap at .github/workflows/checks.yml:421-424; fresh-prose top finding README.md:7 status line.
- - Rules no probe or mechanism covers: 89 of 129 anchors in the parent (rule_audit: 61 unmechanized, 28 judgment). Named by group:
- - Outcomes (5): outcomes-decision-is-argument, outcomes-grant-covers-named-act, outcomes-judge-by-outcome, outcomes-stale-decision-protocol, outcomes-tests-are-statements
- - Roles (13): roles-brief-contents, roles-each-layer-proves-once, roles-findings-are-debts-or-notes, roles-model-per-role-table, roles-one-role-per-agent, roles-opus-shaped-say-so, roles-orchestrator-never-builds, roles-pick-mode-from-request, roles-plan-gets-refuter, roles-resume-by-name, roles-review-cap-three, roles-solo-grows-switch-to-orchestrate, roles-solo-reviews-logic-diffs-only
- - Parallelism (6): parallelism-argue-max-parallelism, parallelism-each-own-checkout, parallelism-keep-going, parallelism-no-guessed-lane-cap, parallelism-no-mid-task-talk, parallelism-own-lane-orchestrator
- - Shared trees (3): shared-trees-confirm-before-write, shared-trees-own-ports-data, shared-trees-reverify-after-incident
- - Git (4): git-integration-branch-merge, git-main-only-by-pr, git-one-record-per-question, git-record-own-file-per-kind
- - Verification (10): verification-announce-own-screen, verification-browser-login-only-needed, verification-checked-reader-for-numbers, verification-counts-from-rest, verification-green-proves-only-its-fixtures, verification-never-dry-run-refusal-list, verification-newest-that-passes, verification-recovery-independent-of-state, verification-screens-verdict, verification-verify-against-repo
- - Tokens (6): tokens-compacting-keep-essentials, tokens-folder-rules-load-by-path, tokens-never-load-whole-doc, tokens-point-brief-at-files, tokens-read-report-not-transcript, tokens-verdict-not-stream
- - Building (8): building-fix-cause-not-symptom, building-guard-needs-incident, building-land-design-or-abandon, building-memory-is-short-term, building-never-drop-item-silently, building-never-guess-answer, building-one-home-per-capability, building-surface-ambiguity
- - Speak plainly (2): speak-never-explain-in-paragraph, speak-rewrite-superseded-in-place
- - Output (8): output-answer-has-a-home, output-bring-decisions-as-question, output-never-echo-agent-report, output-never-hand-off-doable-step, output-never-paste-passing-output, output-start-with-point, output-tracking-turn-one-line, questions-go-to-owner
- - Reports (4): reports-batch-pace-numbers, reports-drop-unused-label, reports-no-report-when-nothing-landed, reports-offer-sweep-after-merge
- - Style (20): style-correct-over-brief, style-cut-narration, style-full-detail-on-request, style-hand-off-cleanup, style-hand-off-irreversible, style-hand-off-one-shell, style-hand-off-runs-as-is, style-keep-critical-full, style-limits-kept-silently, style-measure-before-priority, style-no-unmeasured-estimate, style-offer-override-line, style-offer-screen-takeover, style-plain-words, style-question-inside-box, style-simple-answer-short, style-status-is-report, style-table-gold-column, style-time-central-24h, style-wrong-session-one-line
