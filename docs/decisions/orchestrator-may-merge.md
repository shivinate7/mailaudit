# The batch runner batches and merges

Under the session tiers (claude-settings decision session-tiers), the coordinator holds the owner's standing merge grant (claude-settings decision standing-merge-grant). The batch runner runs every merge under that grant (owner, 2026-11-01 21:34 CST). It owns the integration batch, the CI waits and the merge tool runs. It may merge a pull request to `main` without asking first. Every other rule still applies.

- The coordinator starts the lane sessions and never merges. The batch runner runs every merge under the coordinator's standing merge grant (claude-settings decision standing-merge-grant, owner 2026-11-01 21:34 CST). It merges on green checks and a done review, and never asks the owner to merge. The owner withdraws that grant in chat.
- A lane session runs ALONE: it opens its own PR as a draft, marks it ready when its local checks pass, and hands it to the batch runner for child repos (runner 11) with the head commit, the checks run and a copy to the coordinator. It never merges. The batch runner merges each lane's own PR on its own green run (owner ruling 820 c, page save 2026-11-14 00:19 CST; record `own-820-c-five-repos` in claude-settings). A batch of several lanes still goes through one integration branch, and only its PR goes ready.
- The PR must pass the required check `all-jobs-passed`, which needs every job. A change to a rule, a guard's or check's verdict, or product code needs a fresh reviewer's pass before the merge.
- A Dependabot PR may merge on green CI through the merge tool (owner, 2026-10-27 12:26).

**Process-only, orchestrator default, 2026-10-12:** a polish merge (see `ux-house-rules-govern`) keeps the fresh-reviewer pass. The owner's polish grant covers taste, not review.

**Process-only, coordinator's choice, 2026-11-06 17:30 CST:** before a batch PR goes ready, the batch runner runs `ste-changed origin/main` and `npm run check:docs` on the batch branch. It drops any lane that fails. Three of four red batch runs that day were these checks. `npm run check:docs` takes about 309 s (1 run).

**Holds while:** the owner has not withdrawn the grant or named another session, and branch protection on `main` requires `all-jobs-passed` for every PR, admins included.

## See also

- `main-moves-only-by-pr` — the protection this grant works inside.
