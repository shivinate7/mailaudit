# Assigning an envelope checks in only its recorded cards

A two-tap confirm checks in exactly the cards recorded in an envelope. It checks in nothing else.

**Holds while:** `src/app.jsx` still tags an unexplained entry with the words "no outstanding copy".

Unexplained entries are tagged "no outstanding copy". They stay behind in a smaller envelope. That envelope keeps the original id, `createdAt` and note.

Each envelope has an Edit control and a two-tap Discard control. The last assignment can be undone. The undo notice shows at the vacated slot in the pile, not at the top of the page.

## See also

- `orphaned-mail-never-decides` — the rule that a candidate never checks in a card by itself.
- `candidates-skip-date-filter` — how the candidate that the user confirms is ranked.
- `orphan-entry-takes-one-input` — how the envelope's entries were recorded.
