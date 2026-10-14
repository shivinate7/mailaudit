# Known gaps and to-dos live in debts

Each known gap or to-do is one file under `debts/`, and each file names the decision it belongs to. A record that held a gap keeps its reasons and cites the debt, so each fact lives in one place. `check:records` reads the folder, and CLAUDE.md lists it. Owner ruling 2026-10-14 14:15 CDT.

Kind: process

Home: decisions/debts-hold-known-gaps.md

**Holds while:** `check-records.mjs` reads `debts/` (claim 8), and CLAUDE.md lists that folder.

## Holes, named

Two holes stay open after review round 3. Each is a debt, and each fix is builder work in CI config or tests.

- `ci-misses-check-records-test`: CI never runs `npm run test:check-records`, so a claim 8 regression stays green.
- `check-records-no-record-branch`: the claim 8 branch for a Decision with no record has no test.

## See also

- `records-hold-current-text-only` — a rewrite keeps current text only, and git keeps the history.
