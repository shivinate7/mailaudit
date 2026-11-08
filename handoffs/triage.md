# Role hand-off: mailaudit triage, 2026-11-08 16:55 CST

Written by the desktop triage session (local_37611200-4d33-48f9-a0f9-53f2ca374003) at wind-down. The owner moved the team to the cloud (16:50-16:52 CST). This note is the cloud triage session's start point.

## The role

Triage is the only writer of the waiting page and of this `roadmap` branch. Lanes and the coordinator send their questions to triage, and triage writes each item with the asking session as `owner`. Triage never routes or closes an item it does not own. Read `answers/<id>` before any close.

## The waiting page

- URL https://claude.ai/artifact/FBKSLCBLJsvfNGeePvDz13, slug `72d0bdb1-284a-4557-a80f-e8952f39d3b6`. It is the `waiting-page` key of `.claude/layout-extras.json` on main.
- Live version `1794175951-8545` (2026-11-08 16:12 CST), on claude-settings main page.html `2ac382cc`. Its designData holds `d39-a`, `d39-b`, `d42`, `d47-a` and `d47-b`.
- Open items: list the `items` collection with the artifact database tools and keep `status: open`. Never copy the list here. Items 35 to 71 were written this session. The coordinator closed items 38, 50 (answered), 52, 66, 70 and 71.
- `meta/page.writer` names the desktop triage session. The new writer rewrites it to itself, and rewrites `owner` on each open item whose owner session ended (skill waiting-page, "Rotate the writer").
- Answers from the owner's 10:55 CST Send sit in `answers/`. Each owning session routes its own, and some were still unrouted at wind-down.

## How to republish

Skill `waiting-page` in claude-settings, "Keep the page on main's code":
1. Read the live page in full. A read that overflows the tool's limit is saved to a file. Take the HTML between the untrusted-document tags.
2. `python3 skills/waiting-page/stale_pages.py --page <live> --write <out>`. This uses claude-settings main's page.html and keeps the live designData and roadmap blocks.
3. To add a design: put `"slug": "<html>"` into the designData JSON in `<out>`, writing each `<` as `<`. The mockup file must be on origin under `docs/design/<item folder>/`.
4. Roadmap block: `python3 skills/roadmap/build.py --repo <checkout on roadmap> --live <live.json> --block --out <block>`, then `splice.py --page <out> --block <block> --out <new>`.
5. Put `<!DOCTYPE html>` before the page, or the publish refuses it as text/plain. Publish to the same slug with `base_version` set to the live version. The capabilities `db` and `comments` carry over.
6. Re-read the page: stale_pages must say `current`, and designData must equal the live page's.

## The roadmap branch

- Head at wind-down: see `git log origin/roadmap`. The steps are current to 2026-11-08 03:50 UTC. `waiting/` holds the page copy through item 49. Items 50 to 71 are not copied yet: export with `skills/waiting-page/export_page.py`.
- On the desktop, guard `roadmap-one-writer` refused triage's pushes, because no session could carry the `cs-build:triage` tag. The owner pushed with a bare `override`. A cloud session may meet the same guard.

## Open threads

- Gap with no home: nothing stops a page writer from closing an item whose answer is still waiting (2026-11-08 13:14 CST, item 38). It belongs in claude-settings. The coordinator holds it for the owner's claude-settings prompt.
- Draft PR #221 (todo-mockup-count) waits for the batch runner.
