# A required check on a draft-skipped job is unmeasured

**What.** It is unmeasured how a required check reads a job that the draft guard skipped. The scratch PR measures it, and the owner granted that PR on 2026-10-12. The gap closes when a separate lane runs the PR and records the result in `ci-skips-draft-prs`.

**Status:** open. The scratch PR lane has not run.

**Decision:** `ci-skips-draft-prs`.
