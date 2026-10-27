# The write budget is shared with the ledger push

**Status:** open.

The 500-content-requests/hour cap is shared with the ledger push. Photo uploads draw from the same cap. A first-ever backfill of several hundred photos cannot finish inside one hour. `PHOTO_BATCH` caps a tap at 25 photos. The set difference is resumable, so the next tap continues the work. The loop stops on a 403 or 429 rather than grinding on, per GitHub's own guidance.

**Holds while:** GitHub caps content-generating requests at 500 an hour, and the ledger push shares that cap with photo uploads. `PHOTO_BATCH` is `25` in `src/app.jsx`.

## See also

- `photo-sync-cannot-conflict` — why a resumable set difference is safe to retry
- `push-and-merge-guard-differently` — the other request this budget is shared with
- `watchdog-lives-in-private-repo` — a separate Actions-minutes budget with a similar shape
