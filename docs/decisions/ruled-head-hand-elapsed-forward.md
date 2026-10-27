# Hand the elapsed time forward, never re-derive it

**Status:** retired 2026-10-14. The signal this record pinned fed the GitHub peek check, and that check left the app. The lesson stands for any future resume consumer: a downstream read that comes after a handler clears its time stamp measures zero, and nothing reports it.

**Holds while:** the fresh-session signal no longer exists in `src/app.jsx`.

**Pinned by:** group 40. Its signal pins are retired with the peek, and the test lane re-points them.

Kind: process

Home: docs/decisions/sync-revamp-cloudflare.md

## See also

- `ruled-head-resume-is-reopening` — the resume behavior this signal drove.
