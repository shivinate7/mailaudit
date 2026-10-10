# Auto-apply happens now, and why that changed

**Status:** open. The design is settled, but it is a risk accepted on purpose and worth re-checking as the app changes.

The old rule said the app never applies a remote change unattended. The real objection was never that applying is unsafe. It was that the app could not tell mid-check-in apart from between-sessions. `RESUME_RESET_MS` supplies that discrimination, the same threshold that already resets the Showing filter on resume, so the merge now spends the same finding. Auto-push still refuses on an ahead remote, on purpose, because the idle debounce measures data idleness and not the user's own attention.

## See also

- `ruled-head-a-resume-counts-as-reopening` — the resume threshold this merge now reuses
- `push-and-merge-guard-differently` — why the merge and the push guard on different things
- `sha-accepted-only-after-apply` — the rule that keeps an auto-applied merge honest
