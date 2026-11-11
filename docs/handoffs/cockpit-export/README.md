# Waiting page export ("mailaudit Cockpit")

Exported 2026-11-10 18:30 CST from https://claude.ai/artifact/SUuQ8v7dBDCexif7doGLtj (page version 1794273864-8456), for the move to another account.

- `index.html`: the published page, one file, no separate assets.
- `db/<collection>/<doc_id>.json`: every document in the page's shared database. Collections: `items` (87), `receipts` (50), `groups` (6), `answers` (2), `meta` (1, doc `page`). `asks` was empty.
- The page reads and writes these collections through the `db` runtime capability. Republish `index.html` with `db` declared. Then write each JSON file back to its collection and doc id, dropping any `version` field.
- After republishing, a records PR points `.claude/layout-extras.json` key `waiting-page` at the new URL.
- Private per-user data (`data/users/`) was not exported.
