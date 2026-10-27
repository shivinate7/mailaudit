# Known gaps and to-dos live in debts

Each known gap or to-do is one file under `docs/debts/`, and each file names the decision it belongs to. A record that held a gap keeps its reasons and cites the debt, so each fact lives in one place. `check:records` reads the folder, and CLAUDE.md lists it. Owner ruling 2026-10-14 14:15 CDT.

Kind: process

Home: docs/decisions/debts-hold-known-gaps.md

**Holds while:** `check-records.mjs` reads `docs/debts/` (claim 8), and CLAUDE.md lists that folder.

## See also

- `records-hold-current-text-only` — a rewrite keeps current text only, and git keeps the history.
