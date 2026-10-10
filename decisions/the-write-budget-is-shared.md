# The write budget is shared with the ledger push

**Status:** open.

GitHub caps content-generating requests at 500 per hour, and the ledger push and every photo upload draw from that same cap. A first backfill of several hundred photos cannot finish inside one hour. `PHOTO_BATCH` caps a tap at 25 photos, and the sync stops rather than grinds on a 403 or 429, following GitHub's own guidance.

## See also

- `photo-sync-cannot-conflict` — why a resumable set difference is safe to retry
- `push-and-merge-guard-differently` — the other request this budget is shared with
- `the-watchdog-lives-in-the-private-repo` — a separate Actions-minutes budget with a similar shape
