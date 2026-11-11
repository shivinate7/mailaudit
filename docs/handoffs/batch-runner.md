# Handoff: mailaudit batch runner (cloud)

The repo's batch-runner tier (tag cs-build:batch-runner), child of the mailaudit coordinator. Public copy of the session handoff for the account move (coordinator 18:30 CST 2026-11-10). Session ids and local paths are left out.

## Goal
Batch and merge green, reviewed lane PRs to main for mailaudit. Source: coordinator brief 2026-11-08 19:26 CST; standing go 20:05 CST.

## Working premises
- P1 [ruling] Standing go: merge every lane hand-off that passed review and local checks, with no per-PR word. Docs-only records PRs need no review unless they file an owner ruling (decision docs-only-prs-skip-review). Source: coordinator 20:05 CST 11-08; 11:52 CST 11-09. Checked 11-09.
- P2 [ruling] Main moves only by PR, through the merge tool. Never MCP merge_pull_request. Merge, never rebase. Never merge red CI. Source: coordinator brief 19:26 CST; decision orchestrator-may-merge. Checked 11-10.
- P3 [measured] The merge tool works in cloud (PRs 250 to 318); ready flip is MCP update_pull_request draft=false; branch deletes are refused; `gh api` GET reads work. Run the merge tool alone in its own Bash call, no pipe after it; run checks through `verdict` with no pipe. Source: this session. Checked 11-10 00:45 CST.
- P4 [read] Merge-tool config: `.github/stamp.json` on main = method merge, required check `all-jobs-passed`, deadline 95 min, no readyChecks, no afterMerge. Role: `~/.claude/bin/merge --role batch-runner` writes the merge tool's role file (session, role); a fresh container loses it. Source: origin/main 4e3d792; merge tool output. Checked 11-10 18:27 CST.
- P5 [read] After each resume: get_session alone in its own turn, then `merge --role batch-runner`, then ReadNotifications. After a compaction, read this handoff first. Source: session-start hook. Checked 11-10 18:26 CST.
- P6 [read] A batch's lane set freezes at build start (decision batch-freeze-lane-set). A later lane goes to the next batch. A red drops only its blamed lane. Source: skill ci-hygiene step 8. Checked 11-09.
- P8 [read] After the merge tool's records step on a draft, fetch and fast-forward the local batch; the step may push a records-page commit. Source: PRs 302, 318. Checked 11-10.
- P9 [ruling] Standing items fb-1926-3 (cloud merge facts) and fb-1926-4 (standing rules; report cap 15 lines) stay open. Source: inbox 19:26 CST 11-08. Checked 11-08.
- P10 [ruling] Tell the coordinator when a batch's native or duo-ui job starts. Never dispatch testflight.yml. Batches carry no pro-ui label. Source: coordinator 11-08 and 15:11 CST 11-09. Checked 11-09.
- P11 [measured] Stack a batch on a running batch only one level deep; when both are green, merge only the top. Merging the lower first forces a full CI rerun of the top (decision merge-needs-current-base). Source: PRs 312 and 313, 23:10 CST 11-09. Checked 11-09.
- P12 [measured] docs/debts/notes.md conflicts often: keep both sides; a line both lanes edit keeps the coordinator's pick, with a `Drops-lines:` line in the PR body. Source: batches 23 to 38. Checked 11-09.
- P15 [measured] `Retire-run:` and `Drops-lines:` lines go in the PR body's last paragraph, after the session-URL line, before the 🤖 line. Source: PRs 282, 298. Checked 11-09.
- P18 [measured] duo-ui runs only on native/**, Makefile, shared/**, duo-ui.yml or scripts/ci-sim.sh; cap 90 min; runs took 47 to 55 min (5 runs); the macOS runner wait reached 40 min. Source: runs 42754476536, 42760514599. Checked 11-10.
- P21 [measured] Before every merge, list testflight runs on main; if one is queued or running, merge nothing until it is past Ship. Source: run 42747709994. Checked 11-10 00:44 CST.
- P22 [ruling] Usage brake (decision usage-pause-at-93): at 93% or more, start nothing, open no batch, merge nothing. PAUSE since 00:56 CST 11-10; the coordinator's 18:30 CST message lifted it for the handoff copy only. Source: owner via coordinator. Checked 11-10 18:30 CST.
- P20 [ruling] Prose-judge flags on a line whose claim is a cited run id, slug or waiting-page item are false alarms: note, never route. Source: coordinator 13:08 and 17:14 CST 11-09. Checked 11-10.

## Where things stand
- PAUSED (P22). Account move in progress (coordinator 18:30 CST 11-10).
- Main 4e3d792 (batch 47, PR 318: PRs 314 to 317), merged 00:45 CST 11-10. Batch counter: last batch 47; the next is batch 48. No batch open, nothing queued.
- Open PRs (all drafts, none handed off to batch): 144, 236, 238, 239, 240, 241, 244. Query: `is:pr is:open repo:shivinate7/mailaudit`.
- Leftover branches to delete: triage page item 83.
- Guard asks with the coordinator: step merge-waits-on-ship-run; merge tool should name the top contained batch; notes.md:114 unbacked window.

## Work in flight
- None. No agents, no servers, no check-ins, no subscriptions.

## Next steps
1. On resume (reset Sat 2026-11-14 13:00 CST or owner word): get_session, merge --role, ReadNotifications; read usage before any batch.
2. On a lane hand-off: lane-lint; build `batch/<slug>-48` from origin/main with `git merge --no-ff` and the trailer; secret grep; push; silent-undo strict, debt-retire, batch lane-lint; draft PR via MCP; `merge <n> --confirm` (records step); fetch and fast-forward; when the draft run shows skipped, mark ready, subscribe, send_later; tell coordinator and lane; apply P21 and P11 before merging.

## Files and commands
- `~/.claude/bin/merge --lane-lint <pr|ref>`; `~/.claude/bin/merge <n> --confirm --session mailaudit-batch-runner`.
- `verdict python3 ~/.claude/lint/check_silent_undo.py --strict`; `verdict python3 ~/.claude/lint/check_debt_retire.py`.
- Fetch one ref per command, no -q: `git fetch origin <b>:refs/remotes/origin/<b> 2>&1 | tail -1`.
- Pace one: `git log --format='%ci' <base>..<merge> --no-merges | sort | head -1`.
- Run state: `gh api 'repos/shivinate7/mailaudit/actions/runs?branch=<b>&per_page=6'`; testflight: `gh api 'repos/shivinate7/mailaudit/actions/workflows/testflight.yml/runs?per_page=1'`.
- Times: `~/.claude/bin/now-central`.
