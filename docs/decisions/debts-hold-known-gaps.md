# Known gaps live in debts, and caught tasks live in todo

Each known gap is one file under `docs/debts/`, with a Status line and a Decision line. The Decision line names the record that the gap belongs to, or says none. A record that held a gap keeps its reasons and cites the debt, so each fact lives in one place.

A task that a session caught and did not do is one line in `docs/todo.md`. It is not a debt.

`check:records` reads `docs/debts/`, and CLAUDE.md lists it. Owner rulings: 2026-10-14 14:15 CDT (one debt file for each known gap) and 2026-10-26 (the shared layout puts caught tasks in `docs/todo.md`; claude-settings decision one-layout-every-repo).

Kind: process

Home: docs/decisions/debts-hold-known-gaps.md

**Holds while:** `check-records.mjs` reads `docs/debts/` (claim 8), and CLAUDE.md lists that folder and `docs/todo.md`.

## See also

- `records-hold-current-text-only` — a rewrite keeps current text only, and git keeps the history.
