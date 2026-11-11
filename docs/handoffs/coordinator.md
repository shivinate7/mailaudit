# Handoff: mailaudit coordinator (cloud), session_01MVD32RMmHxq9LhRNihx66B

## Rulings with NO HOME YET
- Owner 2026-11-09 23:46 CST (via degen coordinator): usage pause. Until 7-day usage 93%: favour work close to landing, start little new. At >=93%: hard pause, start nothing, end turn; CI may finish; resume on reset (Sat 2026-11-14 13:00 CST) or owner word. Read: list_events own session, kinds rate_limit_event, utilization. Home: decision usage-pause-at-93 on main (PR 317, batch 47). Relayed to batch runner, triage, testflight and pro-ui lanes.
- Owner answers route through triage to records PRs (standing route 21:18 CST). Coordinator process rulings live in lane briefs: inside a batch PR every Mac job is gating; batches carry no pro-ui label; prose-judge flags on lines citing a run id, decision slug or page item are false alarms (17:14).
- fb-1923-4 (duo-ci-home) and fb-1923-5 (wave-1-lanes): closed on the page 2026-11-08 19:42 CST, home step duo-ci-path.
- Standing (fb-1923-1): no claude-settings edits; never write answers/; merge, never rebase; main only by PR via the batch runner; coordinator never merges; no secret values; never route around a guard; public repo, no secrets or personal data. Times US Central 24 h.

## Goal
Run the mailaudit team in the cloud and work plan cloud-lane-cut (docs/plans/cloud-lane-cut.md on main). Source: owner restart prompt 2026-11-08 19:23 CST; "all holds are lifted" 19:38 CST.

## Working premises
- P1 [ruling] All holds lifted; batch runner merges reviewed green PRs (orchestrator-may-merge). Source: owner chat 2026-11-08 19:38. Checked 2026-11-08.
- P2 [read] Waiting page https://claude.ai/artifact/SUuQ8v7dBDCexif7doGLtj; main's .claude/layout-extras.json points at it (PR 304). Checked 2026-11-09 20:43.
- P3 [measured] Merge tool refuses a batch behind main; red main blocks merges. Source: batch runner merges 294-312. Checked 2026-11-09 23:10.
- P4 [read] Lane start: create_session prompt "/effort medium", source_url repo, tags cs-build:lane, cs-repo, cs-step, cs-topic; brief first line "Lane brief: <step>. Topic: <topic>.". Checked 2026-11-09.
- P5 [read] test-author, reviewer r1 Haiku; reviewer r2-3 Sonnet; builder Sonnet; designers Opus; lanes Opus medium. Source: agent-model-cap. Checked 2026-11-08.
- P6 [ruling] Mac pool rule (07:47 CST): gating batch jobs first-come; tell home batch runner session_01MVD32Mzyop35VGyPniqgok, degen coordinator session_01MVD32QdrtEN15MxhdA1mnU, degen CI lane session_01MVD32QrJjtH1tR1ZSSX4Q2, claude-settings batch runner session_01MVD32Nkb98Q9F2z4tVr9nQ when our gating jobs queue and start. Last told 00:10 CST (PR 313 duo-ui started 23:50).
- P7 [ruling] CI uploads to TestFlight: item 65 a. Source: decision native-ships-via-testflight. Checked 2026-11-09 21:10.
- P8 [measured] TestFlight upload run 42750597378 success, build 202611100404. Checked 2026-11-09 22:15.
- P9 [measured] testflight run pins dispatch sha; freeze merges while one is queued/running until PR 316 lands. Source: run 42747709994.
- P14 [notes] Team dev certs 5 -> 9 tonight (cap ~11); our 3 runs likely made some. HOLD all testflight.yml dispatch until a stored-identity import (pattern: home PR 644) lands; told testflight lane, home and degen coordinators 00:26 CST. Source: home coordinator 00:23.
- P10 [measured] duo-ui.yml paths filter; docs-only batches run no Mac job.
- P11 [measured] gh proxy 403s secrets and other repos; MCP actions_run_trigger works.
- P12 [notes] Owner accepted App Store Connect agreements 22:05 CST. Checked never.
- P13 [notes] Phone installs may go via the Mac (devicectl). Checked never.

## ACCOUNT MOVE (owner, 2026-11-10 18:24 CST)
- Owner moves the whole setup to another account with repo access. Waiting page exported to docs/handoffs/cockpit-export/ on branch claude/mailaudit-cloud-restart-c2z5de. Each session's handoff committed under docs/handoffs/ on its own branch; restart prompt names the shas. New account cannot reach this account's sessions or artifact: new coordinator starts new triage, batch runner, lanes; triage republishes the page from the export and a records PR repoints .claude/layout-extras.json.

## PAUSED
- Hard pause since 00:56 CST 2026-11-10: usage 0.93 at 00:55 (decision usage-pause-at-93 on main). PAUSE sent to batch runner, triage, pro-ui-main-reds, testflight-from-ci; degen coordinator told. Start nothing until reset Sat 2026-11-14 13:00 CST or owner word. On resume: re-read usage, then Next steps.

## Where things stand (checked 2026-11-10 00:47 CST)
- Branch claude/mailaudit-cloud-restart-c2z5de clean, no commits of mine. Main 4e3d792 (PR 318, batch 47: 314-317, 00:45 CST). No batch open. PR 316 fix landed, so P9 merge freeze no longer needed.
- Usage 0.92 at 00:39 CST. New lanes held under the pause ruling.
- Unrouted note: docs/debts/notes.md:114 claims a 1-2 min window without a cite (prose judge, batch 47). Low cost; route after reset.
- Owner page items open: 83, 84, 86.

## Work in flight
- triage session_01MVD32N5Fn7RG22VT5PdLzb; batch runner session_01MVD32PdJsxPJnb9Xcy315c; lane pro-ui-main-reds session_01MVD32N7NGnrATqtKcrXmf5 (holds for item 86). Lane testflight-from-ci done 00:47.
- No agents, servers or check-ins of mine.

## Next steps
1. Next batch merge -> verify main, report four pace numbers (4 = n/a (cloud)). Re-read usage each wake; >=0.93 -> send PAUSE to triage, batch runner, both lanes, end turn.
2. Held (new work, usage pause): lane restyle-step8 (PRs 238+236), lane for debt duo-hand-first-case-timeout, wave-3 restyle-tail. Start only after reset or owner word.
3. Item 86 answer -> pro-ui-main-reds builds (close to landing; Mac run asked of me).
4. Guard steps for the owner to carry to claude-settings: lane-topic-tag-at-create, coord-model-claim-check, lane-no-force-push, lane-pr-opens-draft, lane-lint-runs-docs-check, mac-run-checks-gating-queue, agent-no-branch-reset, guard-cull-false-alarms, red-run-later-cite, prose-judge-unmeasured-ok, coord-reads-code-before-ruling, coord-checks-ruled-before-asking, merge-waits-on-ship-run, merge-top-of-stack.

## Files and commands
- Plan: git show origin/main:docs/plans/cloud-lane-cut.md.
- PRs: gh api "repos/shivinate7/mailaudit/pulls?state=open"; runs: gh api repos/shivinate7/mailaudit/actions/runs/<id>.
- Home coordinator session_01MVD32PfYZbAoSsevAKTMYd.
