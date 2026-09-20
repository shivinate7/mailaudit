# Auto-apply happens now, and why that changed

**Status:** open. The design is settled, but it is a risk accepted on purpose and worth re-checking as the app changes.

The old rule said the app never applies a remote change unattended. The real objection was never that applying is unsafe. It was that the app could not tell mid-check-in apart from between-sessions. `RESUME_RESET_MS` supplies that discrimination, the same threshold that already resets the Showing filter on resume, so the merge now spends the same finding. Auto-push still refuses on an ahead remote, on purpose, because the idle debounce measures data idleness and not the user's own attention.

## The thread, as recorded

```
- **Auto-apply happens now, and why the answer changed is worth recording.**
  This entry used to say the app never applies a remote change on its own. The
  objection was never "applying is unsafe" — it was that *the app could not tell
  mid-check-in from between-sessions*, and merging forty new CSV lines into the
  package list under a thumb is the cascading mis-tap invariant 5 exists to
  prevent. `RESUME_RESET_MS` **is** that discrimination, and the app already
  trusts it with a list reshape when it resets Showing. So the merge now spends
  the same finding. What has *not* changed: it never applies on a timer, never
  mid-thought (the five guards), and never on a remote it could not read.
  Auto-push's `ahead` branch stayed a **refusal** on purpose — the 90s debounce
  measures *data* idleness, not the user's, so it fires exactly when someone is
  reading the screen with a reveal open, and it is the one thing stopping a
  device writing over a remote it is behind (34.19).
```

## See also

- `ruled-head-a-resume-counts-as-reopening` — the resume threshold this merge now reuses
- `push-and-merge-guard-differently` — why the merge and the push guard on different things
- `sha-accepted-only-after-apply` — the rule that keeps an auto-applied merge honest
