# This repo runs the session tiers

The owner granted the session tiers for this repo on 2026-10-28 at 02:31 CDT (item 2 a of the claude-settings coordinator). The claude-settings decision session-tiers defines the tiers. A coordinator starts triage and the batch runner, then lane sessions. Triage is the only writer of the roadmap and the waiting page. The batch runner holds the merge, see `orchestrator-may-merge`.

- The record branch is `roadmap` on origin. It holds the roadmap data, the briefs, the role handoff notes and the outbox. It shares no history with `main`, needs no PR, runs no CI, and never merges into `main`. Its own `CLAUDE.md` gives the steps to file there.
- The roster and the operating model live in the claude.ai project instructions, not in this repo.
- The waiting page is the `waiting-page` key in `.claude/layout-extras.json`.
- The owner, 2026-11-06 15:36 CST, to the desktop session local_3159e21b-972b-4db6-950c-ad7fd0613fda: "the cloud coordinator is just claude-settings helping you get better CI/record-keeping, you can go ahead and restart the actual real work if you're reoriented." No tier and no merge grant moves (process-only).

**Holds while:** the owner has not withdrawn the grant, and origin carries the `roadmap` branch.
