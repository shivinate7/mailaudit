# A device that is behind counts as broken sync

A device that is behind the remote counts as broken sync. The sync line must show it.

**Holds while:** `syncBroken` in `src/app.jsx` is a `useMemo`, and its dependencies include `ahead`.

Auto-push declines while the remote is ahead. The auto-merge fires only on a fresh session. So a device that falls behind mid-session stops backing up. It stops for the rest of that session.

The manila "pushed newer lines" notice lives inside the sync panel. The panel opens only from the sync line. So only a person who already knew to look could find the notice.

The 24-hour backstop could not help. `syncBroken` is a `useMemo`, and it reads `Date.now()`. A stalled device changes none of its dependencies. So the stale check stays frozen too. Tests 38b.1–38b.3 pin this.

## See also

- `ruled-head-one-advisory-entrance` — the one line that reports broken sync.
- `auto-apply-happens-now` — why the auto-merge runs on a fresh session only.
- `ruled-head-hand-elapsed-forward` — the fresh-session signal the merge reads.
- `sync-runs-itself` — the automatic push that declines while behind.
