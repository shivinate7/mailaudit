# Handoff: mailaudit triage (cloud)

## Goal
Be the only writer of the mailaudit waiting page and the roadmap branch: put owner questions on the page in the question form, route answers, export to roadmap. Source: coordinator brief, 2026-11-08 19:26 CST. The owner is moving the setup to another account (coordinator, 2026-11-10 18:30 CST).

## Standing
- fb-1926-1 (coordinator brief, 2026-11-08 19:26 CST): never write answers/ on the page; no destructive git (merge, never rebase); never write a token, cookie or key value; never route around a guard refusal; do not edit claude-settings; owner questions use the question form; push with git push, open PRs with the GitHub MCP tools.
- coord-2118 (coordinator, 2026-11-09 21:18 CST): an owner answer homed in a notes or decision record goes by records PR (round-1 review, then the batch runner), then the item closes; tell the coordinator the PR. No need to ask first.
- usage-pause-at-93 (owner, 2026-11-09 23:46 CST; decision on main): at 93% or more of the weekly usage, start nothing and end the turn, until the reset (Sat 2026-11-14 13:00 CST) or the owner's word. PAUSE in force since 00:56 CST 2026-11-10. The 18:30 CST owner word lifted it for this handoff only.

## Working premises
- P1 [read] The page is https://claude.ai/artifact/SUuQ8v7dBDCexif7doGLtj ("mailaudit Cockpit", page template from claude-settings ddaa393). Main's `.claude/layout-extras.json` key `waiting-page` points to it. It declares the capabilities db and comments. Never delete GRAhbtEyULEWHvk9kF4U3H (the Card in Hand mockup artifact). Checked 2026-11-09.
- P2 [read] Page db at the last export (ex20): 87 items (73 closed, 14 open), 2 answers (hand-suspense-many, hand-post-clears-hold; kept, because triage never writes answers/), 0 asks, 6 groups. Source: ex20. Checked 2026-11-10 18:30 CST.
- P3 [read] Roadmap is ed9b813 (ex20). Main is past 4e3d792 (batch 47). Source: git. Checked 2026-11-10.
- P4 [read] Guards refuse `git worktree add`, GIT_INDEX_FILE, a commit chained with a push, compound or looped git in a worktree, python text naming git, cd into another checkout, a pipe out of verdict, and a lane commit to docs/records.md (rebuilt at merge). Use EnterWorktree and separate calls. Checked 2026-11-09.
- P5 [read] The cloud git proxy refuses branch-delete pushes; item 83 holds them for the owner. Checked 2026-11-09.
- P6 [read] Item writes: only fields in the page's `itemFields` block. Open items need `repo`. Each decision carries the question form (Goal, Problem, Based on, Departs from; gain and lose per option). Before writing an item, check closed items with the same home for a ruling that settles it. Checked 2026-11-09.
- P7 [read] A records PR runs `verdict npm ci`, `verdict npm run check:records`, `verdict npm run check:docs` (about 220 s). A PR that files an owner ruling needs a round-1 reviewer (decision docs-only-prs-skip-review in claude-settings). Checked 2026-11-10.
- P8 [read] The roadmap push guard needs get_session alone in its own turn after each resume. Checked 2026-11-09.
- P9 [read] The web app is live and syncs through the Worker on one device. Two-device merge and native POST are unproven live (debts worker-two-device-proof-unrun, native-sync-live-unrun). Checked 2026-11-09.

## Where things stand
- Waiting page, open items (14; owner field is the coordinator on each):
  - Decisions: 35 duo-card-in-hand-entry, 39 stamp-note-two-lines, 42 duo-hand-post-order, 51 pr144-design-merge, 56 orphaned-meta-line-wraps, 62 tally-320-move, 63 panel-paper-fill, 78 hand-still-owed-place, 79 hand-end-of-day-open, 80 hand-held-words, 84 orphaned-composer-skip, 86 orphaned-composer-dismiss.
  - Tasks: 61 tcgplayer-link-check; 83 delete-mn-r2-gate-red (the owner deletes five branches; on done, check each is gone with ls-remote, then close).
- Closed: the other 73 items. The latest: 76 a (hand-suspense-many, filed by PR 309), 85 a (hand-post-clears-hold, filed by PR 311), 77 a and 81 b (filed by PR 305).
- Answers kept in answers/: hand-suspense-many, hand-post-clears-hold.
- Small option pictures (owner, 2026-11-09 20:47 CST): the page template caps a picture (optPic maxH 480, maxScale 1). Routed to claude-settings. When a new template lands, rebuild the page (stale_pages.py, then migrate the db).
- No open triage PRs. PRs 309, 311 and 317 merged.
- Sessions: coordinator session_01MVD32RMmHxq9LhRNihx66B; batch runner session_01MVD32PdJsxPJnb9Xcy315c.

## Work in flight
- None. No servers. Paused under usage-pause-at-93.

## Next steps
1. On the new account: rebuild the page from the coordinator's export (docs/handoffs/cockpit-export/ on branch claude/mailaudit-cloud-restart-c2z5de). Publish it with capabilities db and comments. Write back items, groups, receipts and meta, never answers/. Set meta writer to the new triage session, and each open item's owner to the new coordinator. Count the records back. Point `waiting-page` in `.claude/layout-extras.json` at the new URL, by a records PR.
2. At each wake, read notifications. Put questions on the page in the question form, after checking past rulings. Export to roadmap `waiting/`.
3. Route owner answers per coord-2118. Write the item's `reply` too, not only a comment-thread reply.

## Files and commands
- Export to roadmap: in a roadmap worktree, `git fetch origin roadmap`, `git merge --ff-only FETCH_HEAD`, then `python3 ~/.claude/skills/waiting-page/export_page.py --fetched <dir> --out waiting --page <page.html> --allow-empty asks`, then add, commit, get_session alone, `git push origin HEAD:roadmap`; each a separate call.
- Fetched dir: one folder per collection (items, answers, groups, asks, meta, receipts), with `.complete` in each.
- Page publish: the Artifact tool, publish with the page file and `capabilities: {db: {}, comments: {}}`; db writes with ArtifactData, each pinned with if_version; a field delete is `{"__delete__": true}`.
- Close an item: status closed, lastAnswer {choice, note, at}, reply, replied; a receipt with read and filed.
