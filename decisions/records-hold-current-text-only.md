# Records hold current text only

A record states what is true now, in the fewest words. When a ruling changes, the record is rewritten in place, and git keeps the old text. Records used to carry their original CLAUDE.md wording in a fence. The lint skipped that text, so it was never checked, and a reader had to tell old wording from current. The owner ruled the fences out on 2026-10-10.

**Holds while:** `check-records.mjs` parses the fences in every record, and no record under `decisions/` keeps a fenced CLAUDE.md quote.

## See also

- `main-moves-only-by-pr` — the other ruling from the same review.
