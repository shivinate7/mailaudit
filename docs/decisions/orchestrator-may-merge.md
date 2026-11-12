# The batch runner batches and merges

Under the session tiers (claude-settings decision session-tiers), the coordinator holds the owner's standing merge grant (claude-settings decision standing-merge-grant). The batch runner runs every merge under that grant (owner, 2026-11-01 21:34 CST). It owns the integration batch, the CI waits and the merge tool runs. It may merge a pull request to `main` without asking first. Every other rule still applies.

- The coordinator starts the lane sessions and never merges. The batch runner runs every merge under the grant named in the opening paragraph, claude-settings standing-merge-grant. It merges on green checks and a done review.
- A lane session never opens an integration PR, marks a PR ready, or merges. It sends each lane branch that passed its local checks and its review to the batch runner, with the head commit, the checks run and the reviewer's verdict. Each lane PR stays a draft.
- The batch runner batches those branches into one integration branch. Its PR is the only one that goes ready, and its run is the only CI run for the batch.
- The PR must pass the required check `all-jobs-passed`, which needs every job. A change to a rule, a guard's or check's verdict, or product code needs a fresh reviewer's pass before the merge.
- A Dependabot PR may merge on green CI through the merge tool (owner, 2026-10-27 12:26).

**Process-only, orchestrator default, 2026-10-12:** a polish merge (see `ux-house-rules-govern`) keeps the fresh-reviewer pass. The owner's polish grant covers taste, not review.

**Process-only, coordinator's choice, 2026-11-06 17:30 CST:** before a batch PR goes ready, the batch runner runs `ste-changed origin/main` and `npm run check:docs` on the batch branch. It drops any lane that fails. Three of four red batch runs that day were these checks. `npm run check:docs` takes about 309 s (1 run).

**Holds while:** the owner has not withdrawn the grant or named another session, and branch protection on `main` requires `all-jobs-passed` for every PR, admins included.

## See also

- `main-moves-only-by-pr` — the protection this grant works inside.
