# Handoff: lane pro-ui-main-reds (mailaudit)

## Goal
Classify and fix or record each red in main's pro-ui-a job (run 42653870499). Source: coordinator lane brief, 2026-11-09 11:45 CST.

## Working premises
- P1 [ruling] This session is a lane under the mailaudit coordinator. Never merge; hand PRs to the batch runner. Source: lane brief. Checked 2026-11-10.
- P2 [ruling] Ask the coordinator before every Mac run. Source: lane brief. Checked 2026-11-09.
- P3 [ruling] PAUSED: start nothing until the usage reset (Sat 2026-11-14 13:00 CST) or the owner's word. Source: coordinator 2026-11-10 00:56 CST, decision usage-pause-at-93. Checked 2026-11-10.
- P4 [ruling] The owner is moving the setup to another account; this handoff is copied to docs/handoffs/lane-pro-ui-main-reds.md on branch lane/pro-ui-main-reds. Source: coordinator 2026-11-10 18:30 CST. Checked 2026-11-10.
- P5 [read] testComposerDraftSurvivesAViewChange (native/ManifestUITests/OrphanedUITests.swift) stays red: the keyboard covers the tab bar and the Orphaned composer has no dismiss route. Recorded as debt composer-keys-cover-tab-bar (decision duo-card-in-hand). Source: origin/main e66ec35 (batch PR 302) and the debt file. Checked 2026-11-10.
- P6 [notes] Owner page item 86 (orphaned-composer-dismiss: add scrollDismissesKeyboard on the Orphaned scroll) is open. Once answered and unpaused, ask the coordinator before building. Source: coordinator messages. Checked never.
- P7 [notes] Owner page item 84 holds the composer contrast named-skip question; the mockup is parked on lane/orphaned-composer-contrast at 99e1b30. Source: coordinator 12:03 CST; git ls-remote. Checked 2026-11-10.

## Where things stand
- All lane PRs merged: 285, 286, 287, 288, 299, 301. Probe PR 297 closed. No open PRs from this lane.
- Remote branches: lane/orphaned-composer-contrast (99e1b30, keep for item 84); lane/pro-ui-main-reds (handoff copy only).
- Query: GitHub PRs by head `lane/*` in shivinate7/mailaudit.

## Work in flight
- None: no agents, no workflow runs, no servers.

## Next steps
1. Stay paused until the reset or the owner's word.
2. Then, if item 86 is answered, ask the coordinator before building; same for item 84.

## Files and commands
- native/ManifestUITests/OrphanedUITests.swift; native/Manifest/OrphanedView.swift; docs/debts/composer-keys-cover-tab-bar.md.
- docs/design/orphaned-composer-contrast.html (on lane/orphaned-composer-contrast).
- Messages: send_message to the coordinator or the batch runner.
