# Records hold current text only

A record states what is true now, in the fewest words. When a ruling changes, the record is rewritten in place, and git keeps the old text. Records used to carry their original CLAUDE.md wording in a fence. The lint skipped that text, so it was never checked, and a reader had to tell old wording from current. The owner ruled the fences out on 2026-10-10.

Kind: process

Home: docs/decisions/records-hold-current-text-only.md

**Holds while:** `check-records.mjs` parses the fences in every record, and no record under `docs/decisions/` keeps a fenced CLAUDE.md quote.

## Kind lines

The owner ruled on 2026-10-14 that each ruling declares its kind, on a line of its own. A mailaudit decision record is its own plan. A build record carries "Kind: build" and one "Plan:" line for each platform: web, native or worker. The Plan line points at a heading in that same record. That section says what to build. A process record carries "Kind: process" and a "Home:" line. The Home line names a rule id or a path where the ruling lives. This record is the home of its own ruling, so its Home line names this file. Each record gains these lines on its next touch. The lint checks decision records only.

## See also

- `main-moves-only-by-pr` — the other ruling from the same review.
