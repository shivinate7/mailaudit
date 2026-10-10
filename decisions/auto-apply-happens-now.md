# Auto-apply happens now, and why that changed

**Status:** open. The design is settled, but it is a risk accepted on purpose and worth re-checking as the app changes.

**Holds while:** `RESUME_RESET_MS` is 60 seconds and `AUTO_PUSH_MS` is 90 seconds in `src/app.jsx`. A change to either value calls for a fresh look at this record. The record names no closing fact, only a re-check trigger.

The app applies a remote change on its own. The real constraint is not that applying is unsafe. The constraint is that the app must not change the list while a check-in is in progress. Merging forty new CSV lines into the package list under a thumb would cause the cascading mis-tap that `no-layout-shift-under-pointer` prevents. `RESUME_RESET_MS` is the threshold that separates a real absence from a short glance away. It is the same threshold that resets the Showing filter on resume, so the merge reuses that signal.

Some rules do not change. The merge never applies on a timer. It never applies mid-thought, which the five guards check. It never applies a remote that it could not read.

Auto-push still refuses an `ahead` remote, on purpose. The 90s debounce measures data idleness, not the user's attention. So it fires while someone reads the screen with a reveal open. The refusal stops a device from writing over a remote that it is behind (34.19).

**Pinned by:** group 40. Mutant confirmed red: the mid-thought guard removed.

## See also

- `ruled-head-resume-is-reopening` — the resume threshold this merge now reuses
- `push-and-merge-guard-differently` — why the merge and the push guard on different things
- `sha-accepted-only-after-apply` — the rule that keeps an auto-applied merge honest
